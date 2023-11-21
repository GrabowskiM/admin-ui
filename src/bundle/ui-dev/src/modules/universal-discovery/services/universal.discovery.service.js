import { showErrorNotification } from '../../common/services/notification.service';
import { handleRequestResponse, handleRequestResponseStatus } from '../../common/helpers/request.helper.js';

const HEADERS_CREATE_VIEW = {
    Accept: 'application/vnd.ibexa.api.View+json; version=1.1',
    'Content-Type': 'application/vnd.ibexa.api.ViewInput+json; version=1.1',
};
const ENDPOINT_CREATE_VIEW = '/api/ibexa/v2/views';
const ENDPOINT_BOOKMARK = '/api/ibexa/v2/bookmark';
const ENDPOINT_LOCATION = '/api/ibexa/v2/module/universal-discovery/location';
const ENDPOINT_ACCORDION = '/api/ibexa/v2/module/universal-discovery/accordion';
const ENDPOINT_LOCATION_LIST = '/api/ibexa/v2/module/universal-discovery/locations';

export const QUERY_LIMIT = 50;

const showErrorNotificationAbortWrapper = (error) => {
    if (error?.name === 'AbortError') {
        return;
    }

    return showErrorNotification(error);
};

const mapSubitems = (subitems) => {
    return subitems.locations.map((location) => {
        const mappedSubitems = {
            location: location.Location,
        };

        if (subitems.versions) {
            const version = subitems.versions.find(({ Version }) => Version.VersionInfo.Content._href === location.Location.Content._href);

            mappedSubitems.version = version.Version;
        }

        return mappedSubitems;
    });
};

export const findLocationsByParentLocationId = (
    {
        token,
        siteaccess,
        parentLocationId,
        limit = QUERY_LIMIT,
        offset = 0,
        sortClause = 'DatePublished',
        sortOrder = 'ascending',
        gridView = false,
    },
    callback,
) => {
    let url = `${ENDPOINT_LOCATION}/${parentLocationId}`;
    if (gridView) {
        url += '/gridview';
    }

    const request = new Request(`${url}?limit=${limit}&offset=${offset}&sortClause=${sortClause}&sortOrder=${sortOrder}`, {
        method: 'GET',
        headers: {
            'X-CSRF-Token': token,
            Accept: 'application/json',
            'X-Siteaccess': siteaccess,
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const { bookmarked, location, permissions, subitems, version } = response.LocationData;
            const subitemsData = mapSubitems(subitems);
            const locationData = {
                location: location ? location.Location : null,
                version: version ? version.Version : null,
                totalCount: subitems.totalCount,
                subitems: subitemsData,
                bookmarked,
                permissions,
                parentLocationId,
            };

            callback(locationData);
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const loadAccordionData = (
    {
        token,
        siteaccess,
        parentLocationId,
        limit = QUERY_LIMIT,
        sortClause = 'DatePublished',
        sortOrder = 'ascending',
        gridView = false,
        rootLocationId = 1,
    },
    callback,
) => {
    let url = `${ENDPOINT_ACCORDION}/${parentLocationId}`;
    if (gridView) {
        url += '/gridview';
    }
    const request = new Request(`${url}?limit=${limit}&sortClause=${sortClause}&sortOrder=${sortOrder}&rootLocationId=${rootLocationId}`, {
        method: 'GET',
        headers: {
            'X-CSRF-Token': token,
            Accept: 'application/json',
            'X-Siteaccess': siteaccess,
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const data = response.AccordionData;
            const mappedItems = data.breadcrumb.map((item) => {
                const location = item.Location;
                const itemData = data.columns[location.id];
                const mappedItem = {
                    location,
                    totalCount: itemData ? itemData.subitems.totalCount : undefined,
                    subitems: itemData ? mapSubitems(itemData.subitems) : [],
                    parentLocationId: location.id,
                    collapsed: !data.columns[location.id],
                };

                return mappedItem;
            });

            const rootLocationData = data.columns[1];
            const lastLocationData = data.columns[parentLocationId];

            if (rootLocationData) {
                mappedItems.unshift({
                    totalCount: rootLocationData ? rootLocationData.subitems.totalCount : undefined,
                    subitems: rootLocationData ? mapSubitems(rootLocationData.subitems) : [],
                    parentLocationId: 1,
                    collapsed: false,
                });
            }

            mappedItems.push({
                location: lastLocationData.location.Location,
                version: lastLocationData.version.Version,
                totalCount: lastLocationData ? lastLocationData.subitems.totalCount : undefined,
                subitems: lastLocationData ? mapSubitems(lastLocationData.subitems) : [],
                bookmarked: lastLocationData.bookmarked,
                permissions: lastLocationData.permissions,
                parentLocationId,
            });

            callback(mappedItems);
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const findLocationsBySearchQuery = (
    { token, siteaccess, query, aggregations, filters, limit = QUERY_LIMIT, offset = 0, languageCode = null },
    callback,
) => {
    const useAlwaysAvailable = true;
    const body = JSON.stringify({
        ViewInput: {
            identifier: `udw-locations-by-search-query-${query.FullTextCriterion}`,
            public: false,
            languageCode,
            useAlwaysAvailable,
            LocationQuery: {
                FacetBuilders: {},
                SortClauses: {},
                Query: query,
                Aggregations: aggregations,
                Filters: filters,
                limit,
                offset,
            },
        },
    });
    const request = new Request(ENDPOINT_CREATE_VIEW, {
        method: 'POST',
        headers: { ...HEADERS_CREATE_VIEW, 'X-Siteaccess': siteaccess, 'X-CSRF-Token': token },
        body,
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const { count, aggregations: searchAggregations, searchHits } = response.View.Result;
            const items = searchHits.searchHit.map((searchHit) => searchHit.value.Location);

            callback({
                items,
                aggregations: searchAggregations,
                count,
            });
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const findLocationsById = ({ token, siteaccess, id, limit = QUERY_LIMIT, offset = 0 }, callback) => {
    const body = JSON.stringify({
        ViewInput: {
            identifier: `udw-locations-by-id-${id}`,
            public: false,
            LocationQuery: {
                FacetBuilders: {},
                SortClauses: { SectionIdentifier: 'ascending' },
                Filter: { LocationIdCriterion: id },
                limit,
                offset,
            },
        },
    });
    const request = new Request(ENDPOINT_CREATE_VIEW, {
        method: 'POST',
        headers: { ...HEADERS_CREATE_VIEW, 'X-Siteaccess': siteaccess, 'X-CSRF-Token': token },
        body,
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const items = response.View.Result.searchHits.searchHit.map((searchHit) => searchHit.value.Location);

            callback(items);
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const findContentInfo = ({ token, siteaccess, contentId, limit = QUERY_LIMIT, offset = 0 }, callback) => {
    const body = JSON.stringify({
        ViewInput: {
            identifier: `udw-load-content-info-${contentId}`,
            public: false,
            ContentQuery: {
                FacetBuilders: {},
                SortClauses: {},
                Filter: { ContentIdCriterion: `${contentId}` },
                limit,
                offset,
            },
        },
    });
    const request = new Request(ENDPOINT_CREATE_VIEW, {
        method: 'POST',
        headers: { ...HEADERS_CREATE_VIEW, 'X-Siteaccess': siteaccess, 'X-CSRF-Token': token },
        body,
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const items = response.View.Result.searchHits.searchHit.map((searchHit) => searchHit.value.Content);

            callback(items);
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const loadBookmarks = ({ token, siteaccess, limit, offset }, callback) => {
    const request = new Request(`${ENDPOINT_BOOKMARK}?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
            'X-Siteaccess': siteaccess,
            'X-CSRF-Token': token,
            Accept: 'application/vnd.ibexa.api.ContentTypeInfoList+json',
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request)
        .then(handleRequestResponse)
        .then((response) => {
            const { count } = response.BookmarkList;
            const items = response.BookmarkList.items.map((item) => item.Location);

            callback({ count, items });
        })
        .catch(showErrorNotificationAbortWrapper);
};

const toggleBookmark = ({ siteaccess, token, locationId }, callback, method) => {
    const request = new Request(`${ENDPOINT_BOOKMARK}/${locationId}`, {
        method,
        headers: {
            'X-Siteaccess': siteaccess,
            'X-CSRF-Token': token,
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request).then(handleRequestResponseStatus).then(callback).catch(showErrorNotificationAbortWrapper);
};

export const addBookmark = (options, callback) => {
    toggleBookmark(options, callback, 'POST');
};

export const removeBookmark = (options, callback) => {
    toggleBookmark(options, callback, 'DELETE');
};

export const loadContentTypes = ({ token, siteaccess }, callback) => {
    const request = new Request('/api/ibexa/v2/content/types', {
        method: 'GET',
        headers: {
            Accept: 'application/vnd.ibexa.api.ContentTypeInfoList+json',
            'X-Siteaccess': siteaccess,
            'X-CSRF-Token': token,
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request).then(handleRequestResponse).then(callback).catch(showErrorNotificationAbortWrapper);
};

export const createDraft = ({ token, siteaccess, contentId }, callback) => {
    const request = new Request(`/api/ibexa/v2/content/objects/${contentId}/currentversion`, {
        method: 'COPY',
        headers: {
            Accept: 'application/vnd.ibexa.api.VersionUpdate+json',
            'X-Siteaccess': siteaccess,
            'X-CSRF-Token': token,
        },
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request).then(handleRequestResponse).then(callback).catch(showErrorNotificationAbortWrapper);
};

export const loadContentInfo = ({ token, siteaccess, contentId, limit = QUERY_LIMIT, offset = 0, signal }, callback) => {
    const body = JSON.stringify({
        ViewInput: {
            identifier: `udw-load-content-info-${contentId}`,
            public: false,
            ContentQuery: {
                FacetBuilders: {},
                SortClauses: {},
                Filter: { ContentIdCriterion: `${contentId}` },
                limit,
                offset,
            },
        },
    });
    const request = new Request(ENDPOINT_CREATE_VIEW, {
        method: 'POST',
        headers: { ...HEADERS_CREATE_VIEW, 'X-Siteaccess': siteaccess, 'X-CSRF-Token': token },
        body,
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request, { signal })
        .then(handleRequestResponse)
        .then((response) => {
            const items = response.View.Result.searchHits.searchHit.map((searchHit) => searchHit.value.Content);

            callback(items);
        })
        .catch(showErrorNotificationAbortWrapper);
};

export const loadLocationsWithPermissions = ({ token, siteaccess, locationIds, signal }, callback) => {
    const request = new Request(`${ENDPOINT_LOCATION_LIST}?locationIds=${locationIds}`, {
        headers: {
            Accept: 'application/vnd.ibexa.api.VersionUpdate+json',
            'X-Siteaccess': siteaccess,
            'X-CSRF-Token': token,
        },
        method: 'GET',
        mode: 'same-origin',
        credentials: 'same-origin',
    });

    fetch(request, { signal }).then(handleRequestResponse).then(callback).catch(showErrorNotificationAbortWrapper);
};
