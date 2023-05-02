// avoid browser caches data.js by inserting an unique identifier
var base_url = "https://raw.githubusercontent.com/ScienisTmiaoT/trends/master/data/";
var name_url = base_url + "name.json" + '?v=' + Date.now();
// set the dimensions and margins of the graph
var margin = {
        top: 10,
        right: 100,
        bottom: 30,
        left: 50
    },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
filenames = ["Monthly", "Daily"]
types = ["movie", "book", "music"]
languages = ["cn", 'en']
svg_suffix = "_svg";
select_suffix = "_select";
domMap = {};
var updateFuncMap = {};

defaultGroups = {
    "movie": {
        "cn": "巴斯特·基顿",
        "en": "Buster Keaton"
    },
    "music": {
        "cn": "险峻海峡",
        "en": "Dire Straits"
    },
    "book": {
        "cn": "伊塔洛·卡尔维诺",
        "en": "Italo Calvino"
    }
}

var lanMap = {
    type: {
        "movie": "电影",
        "music": "音乐",
        "book": "书籍"
    },
    freq: {
        "Daily": "日视图",
        "Monthly": "月视图"
    },
    title: {
        "cn": "豆趋势",
        "en": "Trends"
    }
}

//global 
var isDaily = false;
var isCN = true;
updateTitle()
var curType = "movie";
var cnNameList;
var enNameList;

var config = []
var setDefault = true;
for (var f of filenames) {
    for (var t of types) {
        for (var la of languages) {
            var is_daily = f.toLowerCase() === "daily";
            var id = f.toLowerCase() + "_" + t + "_" + la;
            var pure_id = t + "_" + la;
            var c = {
                name: f,
                csv_url: base_url + id + ".csv" + '?v=' + Date.now(),
                parent_id: "my_dataviz",
                select_id: id + select_suffix,
                svg_id: id + svg_suffix,
                is_daily: is_daily,
                date_format: is_daily ? "%Y-%m-%d" : "%Y-%m",
                defaultGroup: defaultGroups[t][la],
                is_default: setDefault,
                is_cn: la === 'cn',
                pure_id: pure_id
            }
            if (setDefault) {
                isDaily = is_daily;
                curType = isCN ? lanMap.type[t] : t;
            }
            setDefault = false;
            config.push(c);
        }
    }
}

fetch(name_url).then(function (response) {
    // The API call was successful!
    if (response.ok) {
        return response.json();
    } else {
        return Promise.reject(response);
    }
}).then(function (data) {
    // This is the JSON from our response
    drive(data);
}).catch(function (err) {
    // There was an error
    console.warn('Something went wrong.', err);
});

function drive(nameMap) {

    function draw(csv_url, parent_id, select_id, svg_id, is_daily, date_format, defaultGroup, is_default, is_cn, pure_id) {
        var init_select_id = select_id;
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

        domMap[svg_id] = document.querySelector("#" + svg_id);

        if (!is_default) {
            d3.select("#" + svg_id).attr("class", "hide");
            d3.select(select_id).attr("class", "hide");
        }

        //Read the data
        d3.csv(csv_url, function (data) {
            // console.log(data);
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

            updateFuncMap[init_select_id] = update;

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
        draw(c.csv_url, c.parent_id, c.select_id, c.svg_id, c.is_daily, c.date_format, c.defaultGroup, c.is_default, c.is_cn, c.pure_id);
    }

    cnNameList = nameMap["cn"];
    enNameList = nameMap["en"];

    // console.log("cn: " + cnNameList)
    // console.log("en: " + enNameList)
}

const checkBox = document.querySelector("#dn");
checkBox.addEventListener("change", function () {
    var old_id = getId(isCN, isDaily, curType);
    isCN = !isCN;
    curType = isCN ? lanMap.type[curType] : getType(curType);
    updateOptions();
    updateView(isDaily, curType, isCN, old_id, true);
});

const typeSelect = document.querySelector("#type_select");
const pSelect = typeSelect.parentNode;
for (var c of config) {
    var selectList = document.createElement("select");
    selectList.id = c.select_id;
    pSelect.insertBefore(selectList, typeSelect.nextSibling);
    domMap[c.select_id] = selectList;
}

typeSelect.addEventListener("change", function () {
    curType = typeSelect.value;
    updateView(isDaily, curType, isCN, "", false);
});

optionMap = {};
for (var t of types) {
    var option = document.createElement("option");
    var v = isCN ? lanMap.type[t] : t;
    option.value = v;
    option.text = v;
    typeSelect.appendChild(option);
    optionMap[t] = option;
}

const toggleBtn = document.querySelector("#switchBtn");
toggleBtn.textContent = updateBtnText();

toggleBtn.addEventListener("click", function () {
    var old_id = getId(isCN, isDaily, curType);
    isDaily = !isDaily;
    updateView(isDaily, curType, isCN, old_id, false);
});

function updateView(isDaily, type, isCN, old_id, change_language) {
    updateTitle();
    toggleBtn.textContent = updateBtnText();
    var id = getId(isCN, isDaily, type);
    var svg_id = id + svg_suffix;
    var select_id = id + select_suffix;
    var old_select_id = (old_id !== "") ? (old_id + select_suffix) : "";
    var svg = domMap[svg_id];
    var select = domMap[select_id];
    var new_value = select.value;
    if (old_select_id !== "") {
        var old_v = domMap[old_select_id].value;
        if (change_language) {
            new_value = !isCN ? toEnName(old_v) : toCnName(old_v);
            // console.log("new: " + new_value + " old: " + old_v);
        } else new_value = old_v;
    }
    // refresh the view with selected group
    updateFuncMap[select_id](new_value);
    select.value = new_value;
    // console.log("svg: " + svg_id + " select: " + select_id);
    for (const [key, value] of Object.entries(domMap)) {
        if (key === svg_id || key === select_id) {
            // console.log("key: " + key);
            value.classList.remove("hide");
        } else value.classList.add("hide");
    }
}

function getType(cnType) {
    for (const [key, value] of Object.entries(lanMap.type)) {
        if (cnType === value) return key;
    }
}

function getFreq(cnFreq) {
    for (const [key, value] of Object.entries(lanMap.type)) {
        if (cnFreq === value) return key.toLowerCase();
    }
}

function getLan() {
    return isCN ? "cn" : "en";
}

function getLanByVal(isCn) {
    return isCn ? "cn" : "en";
}

function getLowerFreq(isDaily) {
    return isDaily ? filenames[1].toLowerCase() : filenames[0].toLowerCase();
}

function getUpperFreq(isDaily) {
    return isDaily ? filenames[1] : filenames[0];
}

function updateBtnText() {
    return isCN ? lanMap.freq[getUpperFreq(isDaily)] : getUpperFreq(isDaily);
}

function updateTitle() {
    const t = document.querySelector("#title");
    t.text = lanMap.title[getLan()];
}

function updateOptions() {
    for (const [key, value] of Object.entries(optionMap)) {
        var v = isCN ? lanMap.type[key] : key;
        value.value = v;
        value.text = v;
    }
}

function toEnName(name) {
    for (const [i, value] of cnNameList.entries()) {
        if (value === name) {
            return enNameList[i];
        }
    }
}

function toCnName(name) {
    for (const [i, value] of enNameList.entries()) {
        if (value === name) {
            return cnNameList[i];
        }
    }
}

function getId(is_cn, is_daily, type) {
    type = is_cn ? getType(type) : type;
    var id = getLowerFreq(is_daily) + "_" + type + "_" + getLanByVal(is_cn);
    return id;
}