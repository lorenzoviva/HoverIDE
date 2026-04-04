import Component from "../../core/Component.js";
import MenuBar from "./MenuBar.js";

export default class Header extends Component {

    mount() {
        this.root.classList.add("header");

        const menuBar = new MenuBar();
        this.root.appendChild(menuBar.render());
    }

}