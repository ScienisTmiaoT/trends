// avoid browser caches data.js by inserting an unique identifier
var base_url = "https://raw.githubusercontent.com/ScienisTmiaoT/trends/master/data/";
// set the dimensions and margins of the graph
var margin = {
        top: 10,
        right: 100,
        bottom: 30,
        left: 50
    },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const config = [{
        name: "Monthly",
        csv_url: base_url + "monthly.csv" + '?v=' + Date.now(),
        parent_id: "my_dataviz",
        select_id: "monthly_select",
        svg_id: "monthly_svg",
        is_daily: false,
        date_format: "%Y-%m",
        defaultGroup: "Dire Straits",
        is_default: true
    },
    {
        name: "Daily",
        csv_url: base_url + "daily.csv" + '?v=' + Date.now(),
        parent_id: "my_dataviz",
        select_id: "daily_select",
        svg_id: "daily_svg",
        is_daily: true,
        date_format: "%Y-%m-%d",
        defaultGroup: "Dire Straits",
        is_default: false
    }
]

function draw(csv_url, parent_id, select_id, svg_id, is_daily, date_format, defaultGroup, is_default) {
    parent_id = "#" + parent_id;
    select_id = "#" + select_id;
    // append the svg object to the body of the page
    var svg = d3.select(parent_id)
        .append("svg")
        .attr("id", svg_id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    if (!is_default) {
        d3.select("#" + svg_id).attr("class", "hide");
        d3.select(select_id).attr("class", "hide");
    }

    //Read the data
    d3.csv(csv_url, function (data) {
        if (is_daily) {
            // keep last 30 days' data
            data = data.slice(-30);
        }
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

        var parseDate = d3.timeParse(date_format);
        data.forEach(function (d) {
            d.date = parseDate(d.date);
        });
        // add the options to the button
        d3.select(select_id)
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
        d3.select(select_id).on("change", function (d) {
            // recover the option that has been chosen
            var selectedOption = d3.select(this).property("value")
            // run the updateChart function with this selected option
            update(selectedOption)
        })

    })
}

for (var c of config) {
    draw(c.csv_url, c.parent_id, c.select_id, c.svg_id, c.is_daily, c.date_format, c.defaultGroup, c.is_default);
}

const toggleBtn = document.querySelector("#switchBtn");
const toggledViews = {
    "Daily": [],
    "Monthly": []
}

for (var c of config) {
    if (c.is_default) {
        toggleBtn.textContent = c.name;
    }
    toggledViews[c.name].push(document.querySelector("#" + c.svg_id));
    toggledViews[c.name].push(document.querySelector("#" + c.select_id));
}

toggleBtn.addEventListener("click", function () {

    var newText = toggleBtn.textContent;
    for (const [key, value] of Object.entries(toggledViews)) {
        console.log("key: " + key + " value: " + value)
        if (toggleBtn.textContent === key) {
            for (var v of value) {
                v.classList.add("hide");
            }
        } else {
            newText = key;
            for (var v of value) {
                console.log("class: " + v.classList)
                v.classList.remove("hide");
            }
        }
    }
    toggleBtn.textContent = newText;
});