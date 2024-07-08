import ImgToText from './img.to.text';

export default class BasicImgToText extends ImgToText {
    constructor(mainElement) {
        super(mainElement);

        this.btnElement = mainElement.querySelector('.ibexa-btn');
    }
}
