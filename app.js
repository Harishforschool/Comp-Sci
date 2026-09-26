(function () {
    var DELIMITER = ',';
    var NEWLINE = '\n';
    var qRegex = /^"|"$/g;
    var i = document.getElementById('file');
    var table = document.getElementById('table');

    var CATEGORIES = {
        "Transport": ["at public tr", "uber", "bus", "train"],
        "Food": ["bakery", "lunch", "vending dire", "snack", "spiceland", "food"],
        "Tuck shop": ["sk college c", "school"],
        "Entertainment": ["hoyts sylvia", "movie"]
    };

    if (!i) {
        return;
    }

    i.addEventListener('change', function () {
    if (!!i.files && i.files.length > 0) {

        var file = i.files[0];

        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert("Please upload a CSV file.");
            i.value = "";
            return;
        }

        parseCSV(file);
    }
});

    function parseCSV(file) {
        if (!file || !FileReader) {
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            toTable(e.target.result);
        };

        reader.readAsText(file);
    }

    function toTable(text) {
        if (!text || !table) {
            return;
        }

        while (!!table.lastElementChild) {
            table.removeChild(table.lastElementChild);
        }

        var rows = text.split(NEWLINE);
        var headers = rows.shift().trim().split(DELIMITER);
        var htr = document.createElement('tr');

        headers.forEach(function (h) {
            var th = document.createElement('th');
            var ht = h.trim();

            if (!ht) {
                return;
            }

            th.textContent = ht.replace(qRegex, '');
            htr.appendChild(th);
        });

        // Added Type header column
        var typeHeader = document.createElement('th');
        typeHeader.textContent = "Type";
        htr.appendChild(typeHeader);

        var catHeader = document.createElement('th');
        catHeader.textContent = "Category";
        htr.appendChild(catHeader);

        table.appendChild(htr);

        var rtr;

        var categoryTotals = { "Transport": 0, "Food": 0, "Tuck shop": 0, "Entertainment": 0, "Other": 0 };

        rows.forEach(function (r) {
            r = r.trim();

            if (!r) {
                return;
            }

            var cols = r.split(DELIMITER);

            if (cols.length === 0) {
                return;
            }

            rtr = document.createElement('tr');

            var matchedCategory = "Other";
            var rowAmount = 0;
            var transType = "Unknown";
            
            var rowTextToScan = ""; 

            cols.forEach(function (c, index) {
                var td = document.createElement('td');
                var tc = c.trim().replace(qRegex, '');

                td.textContent = tc;
                rtr.appendChild(td);

                if (index === 2 || index === 3) {
                    rowTextToScan += " " + tc.toLowerCase();
                }

                if (index === 5) {
                    var parsed = parseFloat(tc);
                    if (!isNaN(parsed)) {
                        rowAmount = parsed;
                    }
                }
            });

            if (rowAmount < 0) {
                transType = "Debit (Out)";
                for (var cat in CATEGORIES) {
                    if (CATEGORIES.hasOwnProperty(cat)) {
                        var keywords = CATEGORIES[cat];
                        for (var k = 0; k < keywords.length; k++) {
                            if (rowTextToScan.indexOf(keywords[k]) !== -1) {
                                matchedCategory = cat;
                                break;
                            }
                        }
                    }
                }
                categoryTotals[matchedCategory] += rowAmount;
            } else {
                transType = "Credit (In)";
                matchedCategory = "Income";
            }

            // Added Type cell to the row column
            var typeTd = document.createElement('td');
            typeTd.textContent = transType;
            rtr.appendChild(typeTd);

            var catTd = document.createElement('td');
            catTd.textContent = matchedCategory;
            rtr.appendChild(catTd);

            table.appendChild(rtr);
        });

        drawChart(categoryTotals);
    }
})();

function drawChart(categoryTotals) {
    google.charts.setOnLoadCallback(function () {

        var data = google.visualization.arrayToDataTable([
            ['Category', 'Amount'],
            ['Transport', Math.abs(categoryTotals["Transport"])],
            ['Food', Math.abs(categoryTotals["Food"])],
            ['Tuck shop', Math.abs(categoryTotals["Tuck shop"])],
            ['Entertainment', Math.abs(categoryTotals["Entertainment"])],
            ['Other', Math.abs(categoryTotals["Other"])]
        ]);

        var options = {
            title: 'Where Your Money Goes',
            pieHole: 0.4,
            backgroundColor: 'transparent',
            legend: {
                textStyle: {
                    color: 'white'
                }
            },
            titleTextStyle: {
                color: 'white'
            }
        };

        var chart = new google.visualization.PieChart(
            document.getElementById('chart_div')
        );

        chart.draw(data, options);
    });
}