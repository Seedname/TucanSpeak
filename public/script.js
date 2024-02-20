class HealthBar {
    constructor(element, initialValue = 0) {
        this.valueElement = document.querySelector('#health_bar_value');
        this.fillElement = document.querySelector('#health_fill');

        this.setValue(initialValue);
    }

    setValue(newValue) {
        if(newValue < 0) {
            newValue = 0;
        }

        if(newValue > 100) {
            newValue = 100;
        }

        this.value = newValue;
        this.update();

        if(newValue <= 25) {
            this.valueElement.style.color = 'black'
        }
    }

    update() {
        const percentage = this.value + '%'

        this.fillElement.style.width = percentage;
    }

}

class HungerBar {
    constructor(element, initialValue = 0) {
        this.valueElement = document.querySelector('#hunger_bar_value');
        this.fillElement = document.querySelector('#hunger_fill');

        this.setValue(initialValue);
    }

    setValue(newValue) {
        if(newValue < 0) {
            newValue = 0;
        }

        if(newValue > 100) {
            newValue = 100;
        }

        this.value = newValue;
        this.update();

        if(newValue <= 25) {
            this.valueElement.style.color = 'black'
        }
    }

    update() {
        const percentage = this.value + '%'

        this.fillElement.style.width = percentage;
    }

}

class ThirstBar {
    constructor(element, initialValue = 0) {
        this.valueElement = document.querySelector('#thirst_bar_value');
        this.fillElement = document.querySelector('#thirst_fill');

        this.setValue(initialValue);
    }

    setValue(newValue) {
        if(newValue < 0) {
            newValue = 0;
        }

        if(newValue > 100) {
            newValue = 100;
        }

        this.value = newValue;
        this.update();

        if(newValue <= 25) {
            this.valueElement.style.color = 'black'
        }
    }

    update() {
        const percentage = this.value + '%'

        this.fillElement.style.width = percentage;
    }
}

// const healthb = new HealthBar(document.querySelector('.health_bar'), 100)
// const hungerb = new HungerBar(document.querySelector('.hunger_bar'), 100)
// const thirstb = new ThirstBar(document.querySelector('.thirst_bar'), 100)
