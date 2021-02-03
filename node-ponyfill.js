const { PerformanceObserver, performance } = require('perf_hooks');

const entriesList = [];
const observer = new PerformanceObserver((perfObserverList) => {
    entriesList.push(...perfObserverList.getEntries());
});

performance.getEntries = () => {
    return [...entriesList];
};

performance.getEntriesByName = (name, type) => {
    const result = entriesList.filter((entry) => {
        const isSameName = (entry.name === name);
        const isSameType = !type || (entry.type === type);

        return isSameName && isSameType;
    });

    return [...result];
};

performance.getEntriesByType = (type) => {
    const result = entriesList.filter((entry) => {
        return entry.type === type;
    });

    return [...result];
};

observer.observe({
    entryTypes: ['measure', 'mark'],
    buffered: false,
});

module.exports = { PerformanceObserver, performance };
