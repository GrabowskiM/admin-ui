<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\AdminUi\Menu\Admin\ContentType;

use Ibexa\Contracts\AdminUi\Menu\AbstractBuilder;
use Knp\Menu\ItemInterface;

abstract class AbstractContentTypeRightSidebarBuilder extends AbstractBuilder
{
    public function createStructure(array $options): ItemInterface
    {
        /** @var \Symfony\Component\Form\FormView $contentTypeFormView */
        $contentTypeFormView = $options['form_view'];

        /** @var \Knp\Menu\ItemInterface|\Knp\Menu\ItemInterface[] $menu */
        $menu = $this->factory->createItem('root');

        $itemSaveIdentifier = $this->getItemSaveIdentifier();
        $itemCancelIdentifier = $this->getItemCancelIdentifier();

        $menu->setChildren([
            $itemSaveIdentifier => $this->createMenuItem(
                $itemSaveIdentifier,
                [
                    'attributes' => [
                        'class' => 'ibexa-btn--trigger ibexa-btn--save-content-type',
                        'data-click' => sprintf('#%s', $contentTypeFormView['publishContentType']->vars['id']),
                    ],
                ]
            ),
            $itemCancelIdentifier => $this->createMenuItem(
                $itemCancelIdentifier,
                [
                    'attributes' => [
                        'class' => 'ibexa-btn--trigger',
                        'data-click' => sprintf('#%s', $contentTypeFormView['removeDraft']->vars['id']),
                    ],
                ]
            ),
        ]);

        return $menu;
    }

    abstract public function getItemSaveIdentifier(): string;

    abstract public function getItemCancelIdentifier(): string;
}
