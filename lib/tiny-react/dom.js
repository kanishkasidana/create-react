const TinyReact = (function () {
    function createElement(type, attributes = {}, ...children) {
        const childElements = [].concat(...children).reduce(
            (acc, child) => {
                if (child !== null && child !== true && child !== false) {
                    if (child instanceof Object) {
                        acc.push(child)
                    } else {
                        acc.push(createElement("text", {
                            textContent: child
                        }));
                    }
                }
                return acc;
            }, []
        );

        return {
            type,
            children: childElements,
            props: Object.assign({ children: childElements }, attributes)
        }
    }

    const render = function (vdom, container, oldDom = container.firstChild) {
        diff(vdom, container, oldDom);
    }

    const diff = function (vdom, container, oldDom) {
        let oldvdom = oldDom && oldDom._virtualElement;
        let oldComponent = oldvdom && oldvdom.component;

        if (!oldDom) {
            mountElement(vdom, container, oldDom);
        } else if ((vdom.type !== oldvdom.type) && (typeof vdom.type !== "function")) {
            let newDomElement = createDomElement(vdom);
            oldDom.parentNode.replaceChild(newDomElement, oldDom);
        } else if (typeof vdom.type === "function") {
            diffComponent(vdom, oldComponent, container, oldDom);
        } else if (oldvdom && oldvdom.type === vdom.type) {
            if (oldvdom.type === "text") {
                updateTextNode(oldDom, vdom, oldvdom);
            } else {
                updateDomElement(oldDom, vdom, oldvdom);
            }

            oldDom._virtualElement = vdom; //setting a reference back of updated vdom

            //Included Keys 
            let keyedElements = {};
            for (let i = 0; i < oldDom.childNodes.length; i += 1) {
                const domElement = oldDom.childNodes[i];
                const key = domElement._virtualElement.props.key;

                if (key) {
                    keyedElements[key] = {
                        domElement,
                        index: i
                    }
                }
            }

            //Recursively diffing children without keys
            if (Object.keys(keyedElements).length === 0) {
                vdom.children.forEach((child, i) => {
                    diff(child, oldDom, oldDom.childNodes[i]);
                });
            } else {
                //keyed elements
                vdom.children.forEach((virtualElement, i) => {
                    const key = virtualElement.props.key;
                    if (key) {
                        const keyedDomElement = keyedElements[key];
                        if (keyedDomElement) {
                            if (oldDom.childNodes[i] && !oldDom.childNodes[i].isSameNode(keyedDomElement.domElement)) {
                                oldDom.insertBefore(keyedDomElement.domElement, oldDom.childNodes[i]);
                            }
                            diff(virtualElement, oldDom, keyedDomElement.domElement);
                        } else {
                            mountElement(virtualElement, oldDom);
                        }
                    }
                })
            }

            //Remove old dom nodes that do not exist in the new dom
            let oldNodes = oldDom.childNodes;
            if (Object.keys(keyedElements).length === 0) {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = oldNodes.length - 1; i >= vdom.children.length; i -= 1) {
                        let nodeToBeRemoved = oldNodes[i];
                        unmountNode(nodeToBeRemoved, oldDom);
                    }
                }
            } else {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = 0; i < oldDom.childNodes.length; i += 1) {
                        let oldChild = oldDom.childNodes[i];
                        let oldKey = oldChild.getAttribute("key");

                        let found = false;
                        for (let j = 0; j < vdom.children.length; j += 1) {
                            if (vdom.children[j].props.key == oldKey) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            unmountNode(oldChild, oldDom);
                        }
                    }
                }
            }
        }
    }

    function createDomElement(vdom) {
        let newDomElement = null;
        if (vdom.type === "text") {
            newDomElement = document.createTextNode(vdom.props.textContent);
        } else {
            newDomElement = document.createElement(vdom.type);
            updateDomElement(newDomElement, vdom);
        }

        newDomElement._virtualElement = vdom;
        vdom.children.forEach((child) => {
            newDomElement.appendChild(createDomElement(child));
        });

        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement);
        }

        return newDomElement;
    }

    function diffComponent(newVirtualElement, oldComponent, container, domElement) {
        if (isSameComponentType(oldComponent, newVirtualElement)) {
            updateComponent(newVirtualElement, oldComponent, container, domElement);
        } else {
            mountElement(newVirtualElement, container, domElement);
        }
    }

    function updateComponent(newVirtualElement, oldComponent, container, domElement) {
        oldComponent.componentWillReceiveProps(newVirtualElement.props);
        if (oldComponent.shoudComponentUpdate(newVirtualElement.props)) {
            const prevProps = oldComponent.props;
            oldComponent.componentWillUpdate(newVirtualElement.props, oldComponent.state);

            oldComponent.updateProps(newVirtualElement.props);

            //Generate the new vdom
            const nextElement = oldComponent.render();
            nextElement.component = oldComponent; // Set a reference of the oldComponent

            diff(nextElement, container, domElement, oldComponent);

            oldComponent.componentDidUpdate(prevProps);
        }
    }

    function isSameComponentType(oldComponent, newVirtualElement) {
        return oldComponent && newVirtualElement.type === oldComponent.constructor;
    }

    function unmountNode(domElement, parentComponent) {
        const virtualElement = domElement._virtualElement;
        if (!virtualElement) {
            domElement.remove();
            return;
        }

        let oldComponent = domElement._virtualElement._component; // Grab the the component of the domElement.
        if (oldComponent) {
            oldComponent.componentWillUnmount();
        }

        // Recursively unmounting the childNodes
        while (domElement.childNodes.length > 0) {
            unmountNode(domElement.firstChild);
        }

        if (virtualElement && virtualElement.props.ref) {
            virtualElement.props.ref(null);
        }

        //Un mounting event handlers
        Object.keys(virtualElement.props).forEach((propName) => {
            if (propName.slice(0, 2) === "on") {
                const event = propName.toLowerCase().slice(2);
                const handler = virtualElement.props[propName];
                domElement.removeEventListener(event, handler);
            }
        });

        domElement.remove();
    }

    function updateTextNode(domElement, newVirtualElement, oldVirtualElement) {
        if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
            domElement.textContent = newVirtualElement.props.textContent;
        }

        domElement._virtualElement = newVirtualElement;
    }

    const mountElement = function (vdom, container, oldDom) {
        //renders native dom elements as well as functions
        // return mountSimpleNode(vdom, container, oldDom);

        if (isFunction(vdom)) {
            return mountComponent(vdom, container, oldDom);
        } else {
            return mountSimpleNode(vdom, container, oldDom);
        }
    }

    function isFunction(obj) {
        return obj && "function" === typeof obj.type;
    }

    function isFunctionalComponent(vnode) {
        let nodeType = vnode && vnode.type;
        return nodeType && isFunction(vnode) && !(nodeType.prototype && nodeType.prototype.render);
    }

    function buildFunctionalComponent(vnode, context) {
        return vnode.type(vnode.props || {});
    }

    function buildStatefulComponent(virtualElement) {
        const component = new virtualElement.type(virtualElement.props);
        const nextElement = component.render();
        nextElement.component = component; // stores a reference of the component in new rendered element 
        return nextElement; //returns back the virtual element
    }

    function mountComponent(vdom, container, oldDomElement) {
        let nextvdom = null, component = null, newDomElement = null;
        if (isFunctionalComponent(vdom)) {
            nextvdom = buildFunctionalComponent(vdom);
        } else {
            nextvdom = buildStatefulComponent(vdom);
            component = nextvdom.component;
        }

        //render child components
        if (isFunction(nextvdom)) {
            return mountComponent(nextvdom, container, oldDomElement);
        } else {
            newDomElement = mountElement(nextvdom, container, oldDomElement);
        }

        if (component) {
            component.componentDidMount();
            if (component.props.ref) {
                component.props.ref(component);
            }
        }

        return newDomElement;
    }

    const mountSimpleNode = function (vdom, container, oldDomElement, parentComponent) {
        let newDomElement = null; //stores our newly created dom
        const nextSibling = oldDomElement && oldDomElement.nextSibling; //stores siblings if any to track the position for insert or update

        if (vdom.type === "text") {
            newDomElement = document.createTextNode(vdom.props.textContent);
        } else {
            newDomElement = document.createElement(vdom.type);
            updateDomElement(newDomElement, vdom);
        }

        newDomElement._virtualElement = vdom //stores a reference of the vdom in the dom of our newDomElement

        //remove old nodes
        if (oldDomElement) {
            unmountNode(oldDomElement, parentComponent);
        }

        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling);
        } else {
            container.appendChild(newDomElement);
        }

        let component = vdom.component;
        if (component) {
            component.setDomElement(newDomElement);
        }

        // for rendering the children => loop through all the children and mount them individually
        vdom.children.forEach((child) => {
            mountElement(child, newDomElement);
        });

        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement);
        }
    }

    function updateDomElement(domElement, newVirtualElement, oldVirtualElement = {}) {
        const newProps = newVirtualElement.props || {};
        const oldProps = oldVirtualElement.props || {};
        Object.keys(newProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (newProp !== oldProp) {
                if (propName.slice(0, 2) === "on") {
                    //if prop is an event handler
                    const eventName = propName.toLowerCase().slice(2);
                    domElement.addEventListener(eventName, newProp, false);
                    if (oldProp) {
                        domElement.removeEventListener(eventName, oldProp, false);
                    }
                } else if (propName === "value" || propName === "checked") {
                    //value and checked cant be set by setAttributes
                    domElement[propName] = newProp;
                } else if (propName !== "children") {
                    if (propName === "className") {
                        domElement.setAttribute("class", newProps[propName]);
                    } else if (propName === "style" && !newProps[propName].substring) {
                        let styleText = styleObjectToCss(newProps[propName]);
                        domElement.style = styleText;
                    } else {
                        domElement.setAttribute(propName, newProps[propName]);
                    }
                }
            }
        });

        //remove oldProps to ensure th ememory dosent leak
        Object.keys(oldProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (!newProp) {
                if (propName.slice(0, 2) === "on") {
                    domElement.removeEventListener(propName, oldProp, false);
                } else if (propName !== "children") {
                    domElement.removeAttribute(propName);
                }
            }
        });
    }

    function styleObjectToCss(styleObj){
        let styleCss = "";
        let separator = ";";
        let terminator = ";";

        for (let prop in styleObj) {
            if (styleObj.hasOwnProperty(prop)) {
                let val = styleObj[prop];
                styleCss += `${jsToCss(prop)} : ${val} ${terminator}`;
            }
        }

        return styleCss;
    }

    function jsToCss(s){
        let transformedText = s.replace(/([A-Z])/, '-$1').toLowerCase(); // camel case(camelCase) transforms to title case for the css(title-case) 
        return transformedText;
    }

    class Component {
        constructor(props) {
            this.props = props;
            this.state = {};
            this.prevState = {};
        }

        setState(nextState) {
            if (!this.prevState) {
                this.prevState = this.state;
            }

            this.state = Object.assign({}, this.state, nextState);

            let dom = this.getDomElement();
            let container = dom.parentNode;

            let newvdom = this.render();

            diff(newvdom, container, dom);
        }

        setDomElement(dom) {
            this._dom = dom;
        }

        getDomElement() {
            return this._dom;
        }

        updateProps(props) {
            this.props = props;
        }

        //Lifecycle events
        componentWillMount() { }
        componentDidMount() { }
        componentWillReceiveProps(nextProps) { }
        shoudComponentUpdate(nextProps, nextState) {
            return nextProps !== this.props || nextState !== this.state;
        }
        componentWillUpdate(nextProps, nextState) { }
        componentDidUpdate(prevProps, prevState) { }
        componentWillUnmount() { }
    }

    return {
        createElement,
        render,
        Component
    }
}());