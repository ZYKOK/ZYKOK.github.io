Promise.all([
    d3.json("https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson"),
    d3.csv("data/DeathsByState.csv"),
    d3.csv("data/Hospitalisation_processed.csv"),
    d3.csv("data/SeasonalTrends.csv")
]).then(([ausMap, deathsData, hospitalData, seasonalData]) => {
    console.log("Data loaded: ", ausMap);
    console.log("Australia GeoJSON:", ausMap);
    console.log("Deaths by State:", deathsData);
    console.log("Hospitalisations:", hospitalData);
    console.log("Seasonal Trends:", seasonalData);

    deathsData.forEach(d => {
        d.Year = +d.Year;
        d["Count*(CrashID)"] = +d["Count*(CrashID)"];
    });
    hospitalData.forEach(d => {
        d.hospitalisation = +d["Sum(Hospitalisations)"];
        d.age = d["Age_Group"];
        d.gender = d["Gender"];
        d.roaduser = d["Road_User"];
    });
    seasonalData.forEach(d => {
        d.Month = +d.Month;
        d.Year = +d.Year;
        d.Count = +d["Count*(CrashID)"];
        d.Time = d.Time;
        d.Day = d.Day;
    });

    const Tooltip = createTooltip();
    const currentYear = d3.max(deathsData, d => d.Year);
    drawMap(ausMap, deathsData.filter(d => d.Year === currentYear));
    setupYearSlider(deathsData, updateMap);

    initialiseSunburst(hospitalData, Tooltip);

    initializeDashboard(seasonalData, Tooltip);
    setupYearDropdown(seasonalData, Tooltip);
    

}).catch(error => {
    console.error('Error loading the CSV file:', error);
})