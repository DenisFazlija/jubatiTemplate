class Sidebar {
	sidebarOpen = $state(false);

	close() {
		this.sidebarOpen = false;
	}

	open() {
		this.sidebarOpen = true;
	}
}

const sidebar = new Sidebar();

export default sidebar;
