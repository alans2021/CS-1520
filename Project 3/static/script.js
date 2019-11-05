var timeoutID;
var timeout = 1000;

function setup() {
	document.getElementById("submit_message").addEventListener("click", makePost, true);

	timeoutID = window.setTimeout(poller, timeout);
    updateScroll()
}

function makePost() {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

    var name = document.getElementById("username").innerHTML;
	var msg = document.getElementById("post_message").value;

	if (msg != ""){
	    var today = new Date();
	    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;

	    var msgs = [name + ": ", msg, dateTime];
        httpRequest.onreadystatechange = function() { handlePost(httpRequest, msgs) };
        httpRequest.open("POST", "/new_message");
        httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        var data = "msg=" + msg + "&date=" + dateTime;
        httpRequest.send(data);
	}
}

function handlePost(httpRequest, row) {
	if (httpRequest.readyState === XMLHttpRequest.DONE) {
		if (httpRequest.status === 200) {
			addRow(row);
			clearInput();
		} else {
			alert("There was a problem with the post request.");
		}
	}
}

function poller() {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = function() { handlePoll(httpRequest) };
	httpRequest.open("GET", "/messages");
	httpRequest.send();
}

function handlePoll(httpRequest) {
	if (httpRequest.readyState === XMLHttpRequest.DONE) {
		if (httpRequest.status === 200) {
            var rows = JSON.parse(httpRequest.responseText);
            if(rows == null){
                if (window.confirm("Chatroom has been deleted! Click any button to redirect to user page"))
                    window.location.replace("http://127.0.0.1:5000");
                else
                    window.location.replace("http://127.0.0.1:5000");
            }

            for (var i = 0; i < rows.length; i++) {
                addRow(rows[i]);
            }


			timeoutID = window.setTimeout(poller, timeout);

		} else {
			alert("There was a problem with the poll request.  you'll need to refresh the page to recieve updates again!");
		}
	}

}

function clearInput() {
	document.getElementById("post_message").value = "";
}

function addRow(row) {

	var tableRef = document.getElementById("messages_list");
	var nomsg = document.getElementById("no_msg");
	if(nomsg != null)
	    document.getElementById("no_msg").remove();
	var newRow = document.createElement('tr');

    for (var i = 0; i < row.length; i++){
        var newCol  = document.createElement('td');

        if(i == 0){
            newCol.style.fontWeight = 'bold';
            newCol.style.width = '10%';
        }
        else if(i == 1){
            newCol.style.width = '70%';
        }
        else{
            newCol.style.width = '20%';
            newCol.style.fontSize = 'small';
            newCol.style.textAlign = 'right';
        }

        var newText = document.createTextNode(row[i]);
        newCol.appendChild(newText);
        newRow.appendChild(newCol);
    }
    tableRef.appendChild(newRow);
    updateScroll()
}

function updateScroll(){
    var element = document.getElementById("chat_messages");
    element.scrollTop = element.scrollHeight;
}

window.addEventListener("load", setup, true);