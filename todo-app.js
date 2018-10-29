/** @jsx TinyReact.createElement */


const root = document.getElementById("root");

var Step1 = (
    <div>
        <h1 className="header">Hello Tiny React</h1>
        <h2>abcd...</h2>
        <div>section 1
            <div>section 1.1</div>
        </div>
        <h3>This Changes</h3>
        {2 == 1 && <div>it renders if 2 == 1</div>}
        {2 == 2 && <div>2</div>}
        <span>This is a text</span>
        <button onclick={() => alert("hello")}>Click me</button>
        <h4>This gets deleted!</h4>
        1,2,3
    </div>
);

// console.log(Step1);
// TinyReact.render(Step1, root);

var Step2 = (
    <div>
        <h1 className="header">Hello Tiny React</h1>
        <h2>abcd...</h2>
        <div>section 1
            <div>section 1.1</div>
        </div>
        <h3 style="background-color: red">This Changed</h3>
        {2 == 1 && <div>it renders if 2 == 1</div>}
        {2 == 2 && <div>2</div>}
        <span>Click to see a greeting</span>
        <button onclick={() => alert("Good morning!")}>Click me</button>
        {/* 1,2,3 -> if i keep this here, the diffing is different. the statement this gets deleted dosent get deleted, but 1,2,3 gets deleted.This gets deleted dosent even get replaced for now, till step 8 */}
    </div>
);

// setTimeout(() => {
//     alert("Re-rendering");
//     TinyReact.render(Step2, root);
// }, 5000);

//Functional component
const Something = (props) => <span style={props.style}>&copy;</span>

// console.log("Something component", Something);
// TinyReact.render(<Something style="color:blue"/>, root);

//Functional components, props and nested components
const Button = (props) => <button onClick={props.onClick}>{props.children}</button>

const Greeting = (props) => (
    <div className="greeting">
        <h2>Welcome {props.message}</h2>
        <Button onClick={() => alert("Welcome here!")}><Something style="color:yellow" /> 2020 ABC Corporation</Button>
    </div>
);

// TinyReact.render(<Greeting message="Mr. Smith" />, root);

// setTimeout(() => {
//     alert("Re-rendering");
//     TinyReact.render(<Greeting message="Ms. Elizabeth" />, root);
// }, 5000);

//Stateful Component
class Alert extends TinyReact.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "Current time"
        };

        this.getCurrentTime = this.getCurrentTime.bind(this);
    }

    getCurrentTime() {
        this.setState({ title: new Date().toString() });
    }

    render() {
        return (
            <div className="alert-container">
                <h2>{this.state.title}</h2>
                <div>
                    {this.props.message}
                </div>
                <Button onClick={this.getCurrentTime}>Get current time</Button>
            </div>
        );
    }
}

// console.log(Alert);
// TinyReact.render(<Alert message="Heyyooo!!" />, root);

//Diffing with StatefulComponents

class Stateful extends TinyReact.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                <h2>{this.props.title.toString()}</h2>
                <button onClick={update} >Update </button>
            </div>
        );
    }
}

// TinyReact.render(<Stateful title={new Date()} />, root)

function update() {
    TinyReact.render(<Stateful title={new Date()} />, root)
}

//working with refs
class WishList extends TinyReact.Component {
    constructor(props) {
        super(props);

        this.state = {
            wish: {
                title: "Wish 1"
            }
        }

        this.update = this.update.bind(this);
    }

    update() {
        this.setState({
            wish: {
                title: this.title.value
            }
        })
    }

    render() {
        return (
            <div>
                <h2>My Wish List</h2>
                <input type="text" placeholder="Enter your wish" ref={(title) => this.title = title} />
                <button onClick={this.update}>Update</button>
                <div>
                    {this.state.wish.title}
                </div>
            </div>
        )
    }
}

// TinyReact.render(<WishList />, root);

let newElement = (
    <div>
        <p>one</p>
        <p>two</p>
    </div>
);

// TinyReact.render(<WishList />, root);

// TinyReact.render(newElement, root);

// setTimeout(() => {
//     alert("Re-rendering");
//     TinyReact.render(<WishList />, root);
//     // TinyReact.render(newElement, root);
// }, 5000);

// Todo app
let Header = (props) => {
    return (
        <div>
            <h1 style="color: red">{props.text}</h1>
            <h6>(double click on todo to mark as completed)</h6>
        </div>
    );
};

class TodoItem extends TinyReact.Component {
    constructor(props) {
        super(props);

        this.logging = true;
    }

    log(...args) {
        if (this.logging) {
            for (let i = 0; i < args.length; i++) {
                console.log(args[i]);
            }
        }
    }

    componentWillMount() {
        this.log("1. COMPONENT WILL MOUNT");
    }

    componentDidMount() {
        this.log("2. COMPONENT DID MOUNT");
    }

    shouldComponentUpdate(nextProps, nextState) {
        let result = nextProps.task != this.props.task;
        return result;
    }

    componentWillReceiveProps(nextProps) {
        this.log("3. COMPONENT WILL RECEIVE PROPS", JSON.stringify(nextProps));
    }

    componentWillUnmount() {
        this.log("4. COMPONENT WILL UNMOUNT" + this.props.task.title);
    }

    handleEdit = (task) => {
        this.props.onUpdateTask(task.id, this.textInput.value);
    }

    editView = (props) => {
        if (props.task.edit) {
            return (
                <span>
                    <input type="text" className="editItemInput" value={props.task.title} ref={(input) => (this.textInput = input)} />
                    <button onClick={() => this.handleEdit(this.props.task)}><i className="fas fa-save" /></button>
                </span>
            )
        }
        return props.task.title;
    }

    render() {
        let classname = "todo-item ";
        if (this.props.task.completed) {
            classname += "strike";
        }

        let todoItemStyle = {
            color: "red",
            border: "1px solid black"
        }

        return (
            <li style={todoItemStyle} key={this.props.key} className={classname} onDblClick={() => this.props.onToggleComplete(this.props.task)}>
                {this.editView(this.props)}
                <div className="todo-actions">
                    <button onClick={() => this.props.onToggleEdit(this.props.task)}>
                        <i className="fas fa-edit" />
                    </button>
                    <button className="btnDelete" onClick={() => this.props.onDelete(this.props.task)}>
                        <i className="fas fa-trash" />
                    </button>
                </div>
            </li>
        )
    }
}

class TodoApp extends TinyReact.Component {
    constructor(props) {
        super(props);

        this.addTodo = this.addTodo.bind(this);
        this.deleteTodo = this.deleteTodo.bind(this);
        this.onToggleEdit = this.onToggleEdit.bind(this);
        this.onToggleComplete = this.onToggleComplete.bind(this);
        this.onUpdateTask = this.onUpdateTask.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        this.state = {
            tasks: [
                { id: 1, title: "Task 1", edit: false }
            ],
            sortOrder: "asc"
        }
    }

    onKeyDown(e) {
        if (e.which === 13) {
            this.addTodo();
        }
    }

    deleteTodo(task) {
        var tasks = this.state.tasks.filter((t) => {
            return t.id != task.id;
        });

        this.setState({
            header: "# Todos: " + tasks.length,
            tasks
        })
    }

    addTodo() {
        if (this.newTodo.value.trim() == "") {
            alert("Do not do anything");
            return;
        }

        let newTodo = {
            id: +new Date(),
            title: this.newTodo.value,
            edit: false
        }

        this.setState({
            tasks: [...this.state.tasks, newTodo]
        })

        this.newTodo.value = "";
        this.newTodo.focus();
    }

    sortTodo = () => {
        let tasks = null;
        let sortOrder = this.state.sortOrder;
        if (!sortOrder) {
            tasks = this.state.tasks.sort((a, b) => +(a.title > b.title) || -(a.title < b.title));
            sortOrder = "asc";
        } else if (sortOrder === "asc") {
            sortOrder = "desc";
            tasks = this.state.tasks.sort((a, b) => +(b.title > a.title) || -(b.title < a.title));
        } else {
            sortOrder = "asc";
            tasks = this.state.tasks.sort((a, b) => +(a.title > b.title) || -(a.title < b.title));
        }

        this.setState({
            tasks,
            sortOrder
        })
    }

    onUpdateTask(taskId, newTitle) {
        var tasks = this.state.tasks.map((t) => {
            return t.id !== taskId ? t : Object.assign({}, t, { title: newTitle, edit: !t.edit });
        })

        this.setState({
            tasks
        })
    }

    onToggleEdit(task) {
        var tasks = this.state.tasks.map((t) => {
            return t.id !== task.id ? t : Object.assign({}, t, { edit: !t.edit });
        })

        this.setState({
            tasks
        })
    }

    onToggleComplete(task) {
        var tasks = this.state.tasks.map((t) => {
            return t.id !== task.id ? t : Object.assign({}, t, { completed: !t.completed });
        })

        this.setState({
            tasks
        })
    }

    render() {
        let taskUi = this.state.tasks.map((t, i) => {
            return (
                <TodoItem key={t.id} task={t} index={i} onDelete={this.deleteTodo}
                    onToggleEdit={this.onToggleEdit} onToggleComplete={this.onToggleComplete}
                    onUpdateTask={this.onUpdateTask} />
            )
        });

        let sortItem = <i className="fas fa-sort-alpha-down" />;
        if (this.state.sortOrder === "asc") {
            sortItem = <i className="fas fa-sort-alpha-up" />;
        } else {
            sortItem = <i className="fas fa-sort-alpha-down" />;
        }

        return (
            <div className="container">
                <Header text="Todo App" />

                <div className="todo-input-container">
                    <input type="text" className="addItemInput" onKeyDown={this.onKeyDown}
                        ref={(newTodo) => (this.newTodo = newTodo)} placeholder="add a todo" />

                    <button className="addItemButton" onClick={this.addTodo} value="Add Todo">Add Todo</button>
                    <button onClick={this.sortTodo} value="Sort">{sortItem}</button>
                </div>
                <ul className="todos">{taskUi}</ul>
            </div>
        )
    }
}

TinyReact.render(<TodoApp />, root);

