import Base from './base';

export default class ImgToText extends Base {
    constructor(mainElement) {
        // TODO: something something with config
        const someConfig = {
            endpointURL: 'https://jsonplaceholder.typicode.com/posts',
            generatingMsg: null,
        };
        super({ endpointURL: 'https://jsonplaceholder.typicode.com/posts' });

        this.mainElement = mainElement;
        this.btnElement = document.querySelector(mainElement.dataset.btnSelector);
        this.inputElement = document.querySelector(mainElement.dataset.inputSelector);
        this.outputElement = document.querySelector(mainElement.dataset.outputSelector);
        this.savePrevValue = !!mainElement.dataset.savePrevValue;

        this.generatingMsg =
            someConfig.generatingMsg ??
            this.Translator.trans(/*@Desc("AI is generating...")*/ 'ibexa_ai.img_to_text.generating_msg', {}, 'ibexa_ai');

        if (this.savePrevValue) {
            this.prevValue = '';
        }

        this.processOutput = this.processOutput.bind(this);
    }

    getBase64Image(img) {
        const canvas = document.createElement('canvas');

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/png');

        canvas.remove();

        return dataURL;
    }

    disableInputs() {
        this.btnElement.disabled = true;
        this.outputElement.disabled = true;

        if (this.savePrevValue) {
            this.prevValue = this.outputElement.value;
        }

        this.mainElement.classList.add('ibexa-ai-component--disabled');
    }

    enableInputs() {
        this.btnElement.disabled = false;
        this.outputElement.disabled = false;
        this.outputElement.value = this.savePrevValue ? this.prevValue : '';

        this.mainElement.classList.remove('ibexa-ai-component--disabled');
    }

    fetchData(args) {
        this.disableInputs();

        this.outputElement.value = this.generatingMsg;

        super.fetchData(args);
    }

    getRequestBody() {
        const body = {
            img: this.getImgInput(),
        };

        return body;
    }

    getImgInput() {
        if (this.inputElement.src.indexOf('data:image') === 0) {
            return this.inputElement.src;
        }

        return this.getBase64Image(this.inputElement);
    }

    processOutput(response) {
        this.enableInputs();

        // TODO: change having backend
        this.outputElement.value = response[0].title;
    }

    init() {
        super.init();

        this.btnElement.addEventListener('click', () => this.fetchData(), false);
    }
}
