(function($) {
    "use strict"; // Start of use strict
    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 100
    });

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 50
        }
    })

})(jQuery); // End of use strict

//global vars
var expectedBudgets=[];
var loc;
var transacdata;
var recinfo;
var avgdata;

//get current location
navigator.geolocation.getCurrentPosition(showPosition);
function showPosition(position) {
    console.log(position.coords.longitude, position.coords.latitude)
    loc = position.coords.latitude.toString() + ", "+position.coords.longitude.toString();
}

//form
$("#submit").click(function(e){
    e.preventDefault();
    var accntId= {"accountId": $("#accountid").val()};
    accntId["location"]=loc;
    expectedBudgets = [];
    $(".budgetInp").each(function(){  expectedBudgets.push($(this).val());});
    console.log('exp' + expectedBudgets);
    $.ajax({
        type:'POST',
        data: JSON.stringify(accntId),
        url: '/sendId',
        dataType: 'json',
        contentType: 'application/json; charset=UTF-8',
        //piggyback the results, which are basically ALL the comments, onto the server response
        success: function (dat) {
            transacdata = dat;
            handleData(dat)
            d3.select("svg").remove();
            makeGraph(dat)
        }
    }).error(function () {
        console.log("Error sending input")
    })
});



var handleData = function(data) {
    console.log("YAY!", data);
    //get data by category
    categories = {}
    for (ind in data){
        if (categories[data[ind].category]){
            categories[data[ind].category]+= -1*data[ind].amount;
        }
        else
            categories[data[ind].category] = -1 *data[ind].amount;
    }
    //get balance
    $.ajax({
        type:'POST',
        data: JSON.stringify({"shopping": 1, "food": 3, "entertainment":4, "transportation": 2}),
        url: '/categoryRecommendations',
        dataType: 'json',
        contentType: 'application/json; charset=UTF-8',
        success: function (info) {
            recinfo=info;
            getAvg();
        }
    }).error(function () {
        console.log("Error sending input")
    })
};


var getAvg = function () {
    $.ajax({
        type:'POST',
        url: '/avg',
        dataType: 'json',
        contentType: 'application/json; charset=UTF-8',
        success: function (avg) {
            avgdata = avg;
            console.log("IN AVG YASS", avg);
            stackBars(avgdata)
        }
    }).error(function () {
        console.log("Error sending input")
    })
}

var stackBars = function(data) {
    /*
     global avg, user avg
     [0]: food
     [1]: entertainment
     [2]: shopping
     [3]: entertainment
     [4]: other
     */

    $("#stackbar").html("");

    var info = [
        {user: 'All Users', Food: -1*data[0], Entertainment: -1*data[1], Shopping: -1*data[2], Transportation: -1*data[3], Other: -1*data[4]},
        {user: 'Individual', Food: -1*data[5], Entertainment: -1*data[6], Shopping: -1*data[7], Transportation: -1*data[8], Other: -1*data[9]}
    ];
    console.log('values in average',info)

    var xData = ["Food", "Entertainment", "Shopping", "Entertainment", "Other"];

    var margin = {top: 20, right: 50, bottom: 30, left: 50},
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .35);

    var y = d3.scale.linear()
        .rangeRound([height, 0]);

    var color = d3.scale.category20();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select("#stackbar").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g");

    var dataIntermediate = xData.map(function (c) {
        return info.map(function (d) {
            return {x: d.user, y: d[c]};
        });
    });

    var dataStackLayout = d3.layout.stack()(dataIntermediate);

    x.domain(dataStackLayout[0].map(function (d) {
        return d.x;
    }));

    y.domain([0,
        d3.max(dataStackLayout[dataStackLayout.length - 1],
            function (d) { return d.y0 + d.y;})
    ])
        .nice();

    var layer = svg.selectAll(".stack")
        .data(dataStackLayout)
        .enter().append("g")
        .attr("class", "stack")
        .style("fill", function (d, i) {
            return color(i);
        });

    layer.selectAll("rect")
        .data(function (d) {
            return d;
        })
        .enter().append("rect")
        .attr("x", function (d) {
            return x(d.x);
        })
        .attr("y", function (d) {
            return y(d.y + d.y0);
        })
        .attr("height", function (d) {
            return y(d.y0) - y(d.y + d.y0);
        })
        .attr("width", x.rangeBand());

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
};

var makeGraph = function(data) {
    $("#piechar").html("");
    var svg = d3.select("#piechar")
        .append("svg")
        .append("g")

    svg.append("g")
        .attr("class", "slices");
    svg.append("g")
        .attr("class", "labels");
    svg.append("g")
        .attr("class", "lines");

    var width = 960,
        height = 500,
        radius = Math.min(width, height) / 2;

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return d.value;
        });

    var arc = d3.svg.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.4);

    var outerArc = d3.svg.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var key = function (d) {
        return d.data.label;
    };

    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    function relevantSums() {
        var labels = [];
        console.log("YAY!", data);
        var info = [];
        //get data by category
        categories = {};
        var info = [];
        for (ind in data) {
            if (categories[data[ind].category]) {
                categories[data[ind].category] += -1 * data[ind].amount;
            }
            else
                categories[data[ind].category] = -1 * data[ind].amount;
            labels.push(data[ind].category);
            //     balance += data[ind].amount;
        }
        for(key in categories) {
            if(categories[key]>20) {
                info.push({
                    label: key,
                    value: categories[key]
                })
            }
        }
        console.log("CATS",categories);
        console.log("new info",info);
        return info;
    }

    change(relevantSums());


    function change(data) {

        /* ------- PIE SLICES -------*/
        var slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(data));

        slice.enter()
            .insert("path")
            .style("fill", function (d) {
                return color(d.data.label);
            })
            .attr("class", "slice");

        slice
            .transition().duration(1000)
            .attrTween("d", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    return arc(interpolate(t));
                };
            })

        slice.exit()
            .remove();

        /* ------- TEXT LABELS -------*/

        var text = svg.select(".labels").selectAll("text")
            .data(pie(data));

        text.enter()
            .append("text")
            .attr("dy", ".35em")
            .text(function (d) {
                return (d.data.label+": $"+parseInt(d.value));
            });

        function midAngle(d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

        text.transition().duration(1000)
            .attrTween("transform", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate(" + pos + ")";
                };
            })
            .styleTween("text-anchor", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start" : "end";
                };
            });

        text.exit()
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(data));

        polyline.enter()
            .append("polyline");

        polyline.transition().duration(1000)
            .attrTween("points", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });

        polyline.exit()
            .remove();
    }
};



//modal
$('#categoryModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget) // Button that triggered the modal
    var recipient = button.data('type') // Extract info from data-* attributes

    // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
    var fdcount = 0;  //money spent on food and drinks
    var fdamt = 0;
    var ecount = 0;   //money spent on entertainment
    var eamt = 0;
    var scount = 0;   //shopping count
    var samt = 0;
    var tcount = 0;   //transportation count
    var tamt = 0;
    var ocount= 0;    //other count
    var oamt = 0;
    var total = 0;
    var totalamt = 0;
    for(var i = 0; i <transacdata.length; i++)
    {
        var obj = transacdata[i];
        var cat = transacdata[i].category;
        if(cat == "Fast Food" || cat == "Groceries" || cat == "Restaurants"|| cat == "Alcohol and Drinks" || cat == "Coffee")
        {
            fdamt+=obj.amount;
            fdcount++;
        }
        else if(cat == "Entertainment")
        {
            ecount++;
            eamt+=obj.amount;
        }
        else if(cat == "Shopping" || cat == "Clothing")
        {
            scount++;
            samt+=obj.amount;
        }
        else if(cat == "Rental Car & Taxi"|| cat == "Public transportation" || cat == "Air Travel" || cat == "Travel")
        {
            tcount++;
            tamt+=obj.amount;
        }
        else if(obj.amount<0){
            ocount++;
            oamt+=obj.amount;
        }
        if(obj.amount<0)
        {
            total++;
            totalamt += obj.amount;
        }
    }

    var amt;
    var budget;
    var totalbudget = expectedBudgets[0] + expectedBudgets[1] + expectedBudgets[2] + expectedBudgets[3]+expectedBudgets[4];
    if(recipient=="Food and Drinks")
    {
        amt = -1*fdamt;
        budget = expectedBudgets[0];
    }
    else if(recipient=="Transportation")
    {
        amt = -1*tamt;
        budget = expectedBudgets[1];
    }
    else if(recipient=="Shopping")
    {
        budget = expectedBudgets[2];
        amt = -1*samt;
    }
    else if(recipient=="Entertainment")
    {
        budget = expectedBudgets[3];
        amt = -1*eamt;
    }
    else
    {
        budget = expectedBudgets[4];
        amt = -1*oamt;
    }

    console.log("AMT IS : ", amt)
    var data = [budget, Math.round(amt)]; // here are the data values; v1 = total, v2 = current value
    $("#budgetBar").html(""); //clears the budgetBar div
    var chart = d3.select("#budgetBar").append("svg") // creating the svg object inside the budgetBar div
        .attr("class", "chart")
        .attr("width", 200) // bar has a fixed width
        .attr("height", 20 * data.length);

    var x = d3.scale.linear() // takes the fixed width and creates the percentage from the data values
        .domain([0, d3.max(data)])
        .range([0, 200]);

    chart.selectAll("rect") // this is what actually creates the bars
        .data(data)
        .enter().append("rect")
        .attr("width", x)
        .attr("height", 20)
        .attr("rx", 5) // rounded corners
        .attr("ry", 5);

    chart.selectAll("text") // adding the text labels to the bar
        .data(data)
        .enter().append("text")
        .attr("x", x)
        .attr("y", 10) // y position of the text inside bar
        .attr("dx", -3) // padding-right
        .attr("dy", ".35em") // vertical-align: middle
        .attr("text-anchor", "end") // text-align: right
        .text(String);

    modal=$(this);
    modal.find('.modal-title').text(recipient)
    modal.find('.modal-body input').val(recipient)

    //if over 80% of budget, should be red to show warning 
    var divColorChange = modal.find('.modal-body');
    if (amt > budget*.8){
        divColorChange.css("background-color", "maroon");
    }

    var modalRecommendations = $(this).find("#modalrecs");
    modalRecommendations.html("");  //clear modal

    var recType;
    if(recipient=="Food and Drinks")
        recType="food";
    else if(recipient=="Transportation")
    {
        recType = "transportation"
    }
    else if(recipient=="Shopping")
    {
        recType="shopping"
    }
    else if(recipient=="Entertainment")
        recType="entertainment";

    categoryRecommendations = recinfo[recType]
    for (recInd in categoryRecommendations){
        modalRecommendations.append("<h3>"+categoryRecommendations[recInd].name+"</h3>")
        modalRecommendations.append("<h4>"+categoryRecommendations[recInd].location.address+"</h4>")
        modalRecommendations.append("<h4 class='underline'>Number check-ins: "+categoryRecommendations[recInd].stats.checkinsCount + " Number users: " + categoryRecommendations[recInd].stats.usersCount + "</h4>")
    }

});
