export class Popover {
    isOpen = $state(false);
    containerEl: HTMLElement | undefined;

    open = () => {
        this.isOpen = true;
    };

    close = () => {
        this.isOpen = false;
    };

    toggle = () => {
        this.isOpen = !this.isOpen;
    };

    handleWindowClick = (event: MouseEvent) => {
        if (this.isOpen && this.containerEl && !this.containerEl.contains(event.target as Node)) {
            this.close();
        }
    };
}
