module.exports = query => {
    const nsHost = "--ns-host=" + new URL(query.nsHost).toString();

    const startDate = query.startDate
        ? "--start-date=" + new Date(query.startDate).toISOString().substr(0, 10)
        : null

    const endDate = query.endDate
        ? "--end-date=" + new Date(query.endDate).toISOString().substr(0, 10)
        : null

    const startDaysAgo = query.startDaysAgo
        ? "--start-days-ago=" + parseInt(query.startDaysAgo)
        : null

    const endDaysAgo = query.endDaysAgo
        ? "--end-days-ago=" + parseInt(query.endDaysAgo)
        : null

    const categorizeUamAsBasal = query.categorizeUamAsBasal
        ? "--categorize-uam-as-basal=true"
        : null

    return [nsHost, startDate, endDate, startDaysAgo, endDaysAgo, categorizeUamAsBasal].filter(p => p !== null);
}