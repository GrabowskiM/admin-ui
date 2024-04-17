import React, { useState } from 'react';

import { createCssClassNames } from '../../../common/helpers/css.class.names';

const { ibexa } = window;

const Collapsible = ({ isInitiallyExpanded, title, children }) => {
    const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
    const className = createCssClassNames({
        'c-filters__collapsible': true,
        'c-filters__collapsible--hidden': !isExpanded,
    });
    const toggleCollapsed = () => setIsExpanded((prevState) => !prevState);
    const initTooltipsRef = (node) => {
        ibexa.helpers.tooltips.parse(node);
    };

    return (
        <div className={className} ref={initTooltipsRef}>
            <div className="c-filters__collapsible-title" onClick={toggleCollapsed}>
                {title}
            </div>
            <div className="c-filters__collapsible-content">
                <div className="c-filters__collapsible-content-wrapper">{children}</div>
            </div>
        </div>
    );
};

Collapsible.propTypes = {
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    isInitiallyExpanded: PropTypes.bool,
};

Collapsible.defaultProps = {
    isInitiallyExpanded: false,
};

export default Collapsible;
