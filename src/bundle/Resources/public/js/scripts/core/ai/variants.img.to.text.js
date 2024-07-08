import ImgToText from './img.to.text';
import { getInstance } from '../../helpers/object.instances';

export default class VariantsImgToText extends ImgToText {
    constructor(mainElement) {
        super(mainElement);

        this.btnElement = mainElement.querySelector('.ibexa-split-btn__main-btn');
        this.menuInstance = getInstance(mainElement.querySelector('.ibexa-multilevel-popup-menu'));
        this.toggleBtnElement = mainElement.querySelector('.ibexa-split-btn__toggle-btn');
        this.extraBtnElements = this.toggleBtnElement.branchElement.querySelectorAll('.ibexa-ai-component__variant-btn');
        this.suggestionsPopoverElement = this.outputElement
            .closest('.ibexa-ai-wrapper__input')
            .querySelector('.ibexa-ai-wrapper__suggestions');
    }

    disableInputs() {
        super.disableInputs();

        this.mainElement.classList.add('ibexa-split-btn--disabled');
    }

    enableInputs() {
        super.enableInputs();

        this.mainElement.classList.remove('ibexa-split-btn--disabled');
    }

    getRequestBody(args) {
        const body = super.getRequestBody(args);

        return body;
    }

    processOutput(response) {
        if (!Array.isArray(response) || response.length === 1) {
            super.processOutput(response);

            return;
        }

        const countElement = this.suggestionsPopoverElement.querySelector('.ibexa-ai-wrapper__suggestions-footer-count');
        const suggestionsListElement = this.suggestionsPopoverElement.querySelector('.ibexa-ai-wrapper__suggestions-list');
        const { template } = suggestionsListElement.dataset;
        const container = document.createElement('ul');

        response.slice(0, 3).forEach((suggestion) => {
            const suggestionTemplate = template.replace('{{ id }}', suggestion.id).replace('{{ value }}', suggestion.title);

            container.insertAdjacentHTML('beforeend', suggestionTemplate);

            const suggestionNode = container.querySelector('li');

            suggestionsListElement.append(suggestionNode);

            suggestionNode.addEventListener('click', () => {
                this.outputElement.value = suggestion.title;

                this.suggestionsPopoverElement.classList.add('ibexa-ai-wrapper__suggestions--hidden');
            });
        });

        countElement.innerHTML = `${response.length}/${response.length}`;

        this.enableInputs();
        this.suggestionsPopoverElement.classList.remove('ibexa-ai-wrapper__suggestions--hidden');
    }

    initSuggestions() {
        const { Popper } = window;

        this.suggestionsPopoverElement.style.width = `${this.outputElement.offsetWidth}px`;

        Popper.createPopper(this.outputElement, this.suggestionsPopoverElement, {
            placement: 'bottom-start',
            modifiers: [
                {
                    name: 'flip',
                    enabled: true,
                    options: {
                        fallbackPlacements: 'bottom',
                    },
                },
                {
                    name: 'offset',
                    options: {
                        offset: [0, 8],
                    },
                },
            ],
        });
    }

    init() {
        super.init();

        this.initSuggestions();

        this.extraBtnElements.forEach((extraBtnElement) => {
            extraBtnElement.addEventListener(
                'click',
                () => {
                    this.menuInstance.closeMenu();
                    this.fetchData({ prompt: extraBtnElement.dataset.prompt });
                },
                false,
            );
        });
    }
}
