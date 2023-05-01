// avoid browser caches data.js by inserting an unique identifier
var csv_url = "https://raw.githubusercontent.com/ScienisTmiaoT/trends/master/data/monthly.csv";
var latest_url = csv_url + '?v=' + Date.now();
// set the dimensions and margins of the graph
var margin = {
        top: 10,
        right: 100,
        bottom: 30,
        left: 50
    },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv(latest_url, function (data) {
    // List of groups (here I have one group per column)
    var allGroup = []
    var updated = false
    var maxY = 0
    for (var i of data) {
        for (const [key, value] of Object.entries(i)) {
            var v = parseInt(value)
            if (key !== 'date') {
                if (v > maxY) {
                    maxY = v;
                }
                if (!updated) {
                    allGroup.push(key);
                }
            }
        }
        updated = true;
    }
    var defaultGroup = "Dire Straits";

    var parseDate = d3.timeParse("%Y-%m");
    data.forEach(function (d) {
        d.date = parseDate(d.date);
    });
    // add the options to the button
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) {
            return d;
        }) // text showed in the menu
        .attr("value", function (d) {
            return d;
        }) // corresponding value returned by the button

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
        .domain(allGroup)
        .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        // .domain([0,10])
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Initialize line with group a
    var line = svg
        .append('g')
        .append("path")
        .datum(data)
        .attr("d", d3.line()
            .x(function (d) {
                return x(+d.date)
            })
            .y(function (d) {
                return y(+d[defaultGroup])
            })
        )
        .attr("stroke", function (d) {
            return myColor(defaultGroup)
        })
        .style("stroke-width", 4)
        .style("fill", "none")

    // A function that update the chart
    function update(selectedGroup) {

        // Create new data with the selection?
        var dataFilter = data.map(function (d) {
            return {
                date: d.date,
                value: d[selectedGroup]
            }
        })

        // Give these new data to update line
        line
            .datum(dataFilter)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(function (d) {
                    return x(+d.date)
                })
                .y(function (d) {
                    return y(+d.value)
                })
            )
            .attr("stroke", function (d) {
                return myColor(selectedGroup)
            })
    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        update(selectedOption)
    })

})