var months = new Array('January', 'February', 'March',
                         'April', 'May', 'June', 'July', 'August',
                         'September', 'October', 'November', 'December');
var month;
var cat_delete;

function setup() {
	document.getElementById("catButton").addEventListener("click", sendCat, true);
	document.getElementById("purchButton").addEventListener("click", sendPurch, true);
    var d = new Date();
    month = d.getMonth();
    document.getElementById('header').innerHTML = "Budget for " + months[month];

    makeRec("GET", "/cats", 200, add_rows);     //Ensures data persists across refreshes
}


/***********************************************************
 * AJAX boilerplate
 ***********************************************************/

function makeRec(method, target, retCode, handlerAction, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, handlerAction);
	httpRequest.open(method, target);

	if (data) {
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}
}


function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("Received response text:  " + httpRequest.responseText);
				if(action)
				    action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}


/*******************************************************
 * actual client-side app logic
 *******************************************************/


function sendPurch() {
	var newCat = document.getElementById("catPurchase").value
	if(newCat === '')
	    newCat = 'Miscellaneous'
	var newPurch = document.getElementById("newPurchase").value
	var newPrice = document.getElementById("purchasePrice").value
	var newDay = document.getElementById("purchaseDay").value

    if (!isNaN(newPrice) && !isNaN(newDay)){
        newPrice = Number(newPrice);
        newDay = Number(newDay);
        if (newPrice > 0 && newDay > 0 && newDay < 32){
            var data;
            data = "cat=" + newCat + "&item=" + newPurch + "&price=" + newPrice + "&date=" + months[month] + " " + newDay;
            console.log("POST REQUEST FOR /purchases....")
            makeRec("POST", "/purchases", 201, modify_row, data);
        }
        else
            alert("Entered values must be valid")
	}
	else
	    alert("Price and Day must be numerics.")
	document.getElementById("catPurchase").value = ''
	document.getElementById("newPurchase").value = ''
	document.getElementById("purchasePrice").value = ''
	document.getElementById("purchaseDay").value = ''
}


function sendCat() {
	var newCat = document.getElementById("newCategory").value
	var newBudget = document.getElementById("budgetLimit").value
	var data;
	if (!isNaN(newBudget)){
        newBudget = Number(newBudget);
        if (newBudget > 0){
            data = "cat=" + newCat + "&budget=" + newBudget;
            console.log("POST REQUEST FOR /cats....")
            makeRec("POST", "/cats", 201, add_row, data);
        }
        else
            alert("Budget must be a valid number!")
    }
    else
        alert("Budget must be a number!")
    document.getElementById("newCategory").value = ""
    document.getElementById("budgetLimit").value = ""
}


function deleteCat(category) {
    cat_delete = category;
	makeRec("DELETE", "/cats", 204, delete_row, "cat=" + category);
}


function modify_row(responseText) {
	var data = JSON.parse(responseText);
    var category = data['cat'];

    if (category != null){
        var prev = Number(document.getElementById('value_' + category).innerHTML);
        var value;
        if (category === 'Miscellaneous'){
            value = prev + Number(data['price']);
            document.getElementById('value_' + category).innerHTML = value;
        }
        else{
            var maxValue = Number(document.getElementById('max_' + category).innerHTML);
            var desc = document.getElementById('desc_' + category).innerHTML;
            if (desc.includes('remaining')){
                value = prev - Number(data['price']);
                if (value >= 0)
                    document.getElementById('value_' + category).innerHTML = value;
                else{
                    value = value * -1;
                    document.getElementById('value_' + category).innerHTML = value;
                    document.getElementById('desc_' + category).innerHTML = ' over budget';
                }
            }
            else{
                value = prev + Number(data['price']);
                document.getElementById('value_' + category).innerHTML = value;
            }
        }
    }
    else
        alert("Category doesn't exist yet. Must add that category first")

    console.log('GET REQUEST FOR /purchases');
    makeRec("GET", "/purchases", 200);
}


// helper function for add_row:
function addCell(row, text) {
	var newCell = row.insertCell();
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function add_row(responseText) {
	var data = JSON.parse(responseText);
    var tab = document.getElementById("summary");
    var category = Object.keys(data)[0];
    var budget = data[category];

    var newRow = tab.insertRow();
    addCell(newRow, category);          // Adds new category in first column

    var cell2 = newRow.insertCell();    // Does budget description in second column
    cell2.appendChild(document.createTextNode('$'));    //Adds '$'
    var value_span = document.createElement('span');
    value_span.setAttribute("id", "value_" + category);
    value_span.innerHTML = budget;
    cell2.appendChild(value_span);                      //Adds value_<category> object
    cell2.appendChild(document.createTextNode(' of '));   //Adds 'of'
    var max_span = document.createElement('span');
    max_span.setAttribute("id", "max_" + category);
    max_span.innerHTML = budget;
    cell2.appendChild(max_span);                        //Adds max_<category> object
    var desc_span = document.createElement('span');
    desc_span.setAttribute("id", "desc_" + category);
    desc_span.innerHTML = " remaining in budget";
    cell2.appendChild(desc_span);                        //Adds desc_<category> object

    var cell3 = newRow.insertCell();        // Adds delete button in 3rd column
	newButton = document.createElement("input");
	newButton.type = "button";
	newButton.value = "Delete";
	newButton.addEventListener("click", function() { deleteCat(category); });
	cell3.appendChild(newButton);

    console.log('GET REQUEST FOR /cats');
    makeRec("GET", "/cats", 200);
}

function delete_row(responseText) {
    var cell = document.getElementById('value_' + cat_delete)
    var row = cell.parentNode.parentNode;
    row.parentNode.removeChild(row);
}

function add_rows(responseText){
    var data = JSON.parse(responseText);
    for (var cat in data){
        var value = data[cat];
        if (cat !== 'Miscellaneous'){
            var obj = {};
            obj[cat] = value;
            add_row(JSON.stringify(obj));
        }
    }
    makeRec("GET", "/purchases", 200, modify_rows);     //After cats are done, must get all the purchases done
}

function modify_rows(responseText){
    var data = JSON.parse(responseText);
    for (var key in data){
        var obj = data[key];
        modify_row(JSON.stringify(obj));
    }
}


// setup load event
window.addEventListener("load", setup, true);
