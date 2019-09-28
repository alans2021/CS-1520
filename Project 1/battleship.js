var current = 0; //Current player is player1 at the beginning
var player1, player2;
var air, bat, sub;
var scores = [24, 24];
var airleft = [5, 5]; //# of aircraft positions not hit
var batleft = [4, 4]; //# of battleship positions not hit
var subleft = [3, 3]; //# of submarine positions not hit
var redTiles =[[], []]; //Array at index zero is locations of hits on player 1's ships
var whiteTiles =[[], []];
initialization();

//Block of code that runs when page is first accessed
function initialization(){
    var headings = document.getElementsByTagName("h3");
    headings[0].style.display = 'none';
    headings[1].style.display = 'none';
    player1 = prompt("What is Player 1's name?");
    var info = checkShips(player1);
    var air1 = info[0];
    var bat1 = info[1];
    var sub1 = info[2];

    player2 = prompt("What is Player 2's name?");
    info = checkShips(player2);
    var air2 = info[0];
    var bat2 = info[1];
    var sub2 = info[2];

    air = [air1, air2];
    bat = [bat1, bat2];
    sub = [sub1, sub2];

    alert("Click OK to begin " + player1 + "'s turn");
    headings[0].style.display = 'block';
    headings[1].style.display = 'block';
    createTables();
    showShips(current);
}

//Create two 10x10 tables. Also bind function to clickable cells on table
function createTables(){
    var top_table = document.getElementById("top_table");
    for(var i = 0; i < 10; i++){
        var row = document.createElement('tr');
        for(var j = 0; j < 10; j++){
            var col = document.createElement('td');
            col.onclick = function() { //top_table should have each cell be clickable
                clickBox(this);
            };
            row.appendChild(col);
        }
        top_table.appendChild(row);
    }

    var bottom_table = document.getElementById("bottom_table");
    for(var i = 0; i < 10; i++){
        var row = document.createElement('tr');
        for(var j = 0; j < 10; j++){
            var col = document.createElement('td');
            row.appendChild(col);
        }
        bottom_table.appendChild(row);
    }
}

//When other player's turn, first make all cells the blue color
function resetTables(){
    var top = document.getElementById("top_table");
    var bottom = document.getElementById("bottom_table");
    var tables = [top, bottom];
    for(var x = 0; x < 2; x++){
        for(var i = 0; i < 10; i++){
            for(var j = 0; j < 10; j++){
                tables[x].rows[i].cells[j].style.backgroundColor = '#87CEFA';
                if(x == 1)
                    tables[x].rows[i].cells[j].innerHTML = '';
            }
        }
    }
}

//Show the ship placements
function showShips(index){
    var table = document.getElementById("bottom_table");
    for(var i = 0; i < 10; i++){ //Make sure everything set to empty
        for(var j = 0; j < 10; j++)
            table.rows[i].cells[j].innerHTML = "";
    }

    for(var i = air[index][0]; i <= air[index][2]; i++){ //Show aircraft carrier
        for(var j = air[index][1]; j <= air[index][3]; j++){
            table.rows[i].cells[j].innerHTML = "A";
        }
    }
    for(var i = bat[index][0]; i <= bat[index][2]; i++){ //Show battleship
        for(var j = bat[index][1]; j <= bat[index][3]; j++){
            table.rows[i].cells[j].innerHTML = "B";
        }
    }
    for(var i = sub[index][0]; i <= sub[index][2]; i++){ //Show submarine
        for(var j = sub[index][1]; j <= sub[index][3]; j++){
            table.rows[i].cells[j].innerHTML = "S";
        }
    }
}

//For each player's turn, show the tiles that are red and white
function showColors(player){
    var other = (player + 1) % 2;
    var table1 = document.getElementById("top_table");
    for(var i = 0; i < redTiles[other].length; i++){
        var loc = redTiles[other][i]; //Set any relevant tiles to red
        table1.rows[loc[0]].cells[loc[1]].style.backgroundColor = 'red';
    }
    for(var i = 0; i < whiteTiles[other].length; i++){
        loc = whiteTiles[other][i]; //Set any relevant tiles to white
        table1.rows[loc[0]].cells[loc[1]].style.backgroundColor = 'white';
    }

    var table2 = document.getElementById("bottom_table");
    for(var i = 0; i < redTiles[player].length; i++){
        var loc = redTiles[player][i]; //Set any relevant tiles to red
        table2.rows[loc[0]].cells[loc[1]].style.backgroundColor = 'red';
    }
    for(var i = 0; i < whiteTiles[player].length; i++){
        loc = whiteTiles[player][i]; //Set any relevant tiles to white
        table2.rows[loc[0]].cells[loc[1]].style.backgroundColor = 'white';
    }
}

//Behavior for when box clicked
function clickBox(tableCell){
    if(tableCell.style.backgroundColor == 'red' || tableCell.style.backgroundColor == 'white')
        return; //Do nothing if cell that's already been clicked is clicked
    var col = tableCell.cellIndex; //Column index
    var row = tableCell.parentNode.rowIndex - 1; //Row index
    var other = (current + 1) % 2; //Other player index
    var isHit = false;
    if(air[other][0] <= row && row <= air[other][2] && air[other][1] <= col && col <= air[other][3]){ //Check if hit
        airleft[other]--;
        isHit = true;
    }
    else if(bat[other][0] <= row && row <= bat[other][2] && bat[other][1] <= col && col <= bat[other][3]){
        batleft[other]--;
        isHit = true;
    }
    else if(sub[other][0] <= row && row <= sub[other][2] && sub[other][1] <= col && col <= sub[other][3]){
        subleft[other]--;
        isHit = true;
    }

    if(isHit){
        if(airleft[other] == 0){
            airleft[other] = -1; //Ensures this not mistaken as zero in the future
            setTimeout(alertClick, 10, "Aircraft carrier has been sunk");
        }
        else if(batleft[other] == 0){
            batleft[other] = -1; //Ensures this not mistaken as zero in the future
            setTimeout(alertClick, 10, "Battleship has been sunk");
        }
        else if(subleft[other] == 0){
            subleft[other] = -1; //Ensures this not mistaken as zero in the future
            setTimeout(alertClick, 10, "Submarine has been sunk");
        }
        else
            setTimeout(alertClick, 10, "Hit!");
        tableCell.style.backgroundColor = 'red';
        redTiles[other].push([row, col]); //Add that location as a redtile for that player
        scores[other] -= 2;
    }
    else{
        setTimeout(alertClick, 10, "Miss");
        tableCell.style.backgroundColor = 'white';
        whiteTiles[other].push([row, col]); //Add as white tile location
    }
}

//Alert if hit or miss
function alertClick(message){
    alert(message);
    var other = (current + 1) % 2;
    if(scores[other] === 0){
        gameEnds();
        return;
    }

    if(current == 0)
        setTimeout(alertNext, 10, "Click 'OK' to begin " + player2 + "'s turn");
    else
        setTimeout(alertNext, 10, "Click 'OK' to begin " + player1 + "'s turn");
    resetTables(); //Make sure next player doesn't see information it shouldn't
    current = other;
}

//Alert next player to start. Then show player's ships
function alertNext(message){
    alert(message);
    showShips(current); //Show ships for other player on bottom grid
    showColors(current); //Make sure colors match
}

function gameEnds(){
    var x = showScores();
    saveScores(x, scores[current]);
    var sorted = sortScores();

    var list = document.createElement("ol");
    list.style.fontWeight = 'bold';
    var title = document.createTextNode("TOP 10 LEADERBOARD:");
    list.appendChild(title);
    for(var i = sorted.length - 1; i >= 0; i--){
        var entry = document.createElement("li");
        var text = document.createTextNode(sorted[i] + ": " + localStorage.getItem(sorted[i]));
        entry.appendChild(text);
        list.appendChild(entry);
    }
    document.body.appendChild(list);
}

//Show winner and scores of each player; Save score to local storage
function showScores(){
    if(current === 0)
        var playWin = player1;
    else
        var playWin = player2;

    var x = document.getElementsByTagName("h3");
    for(var i = x.length - 1; i >= 0; i--)
        document.body.removeChild(x[i]);
    x = document.getElementsByTagName("table");
    for(var i = x.length - 1; i >= 0; i--)
        document.body.removeChild(x[i]);

    var winner = document.createElement("h4");
    var textnode = document.createTextNode(playWin + " wins!");
    winner.appendChild(textnode);

    var score1 = document.createElement("h4");
    textnode = document.createTextNode(player1 + "'s score: " + scores[0]);
    score1.appendChild(textnode);

    var score2 = document.createElement("h4");
    textnode = document.createTextNode(player2 + "'s score: " + scores[1]);
    score2.appendChild(textnode);

    document.body.appendChild(winner);
    document.body.appendChild(score1);
    document.body.appendChild(score2);
    return playWin;
}

//Save scores to local storage
function saveScores(playerName, playerScore){
    if(localStorage.length === 10){
        var minKey = localStorage.key(0);
        for(var i = 0; i < 10; i++){
            if(localStorage.getItem(localStorage.key(i)) <= localStorage.getItem(minKey))
                minKey = localStorage.key(i);
        }
        if(scores[current] > localStorage.getItem(minKey)){
            localStorage.setItem(playerName, playerScore);
            localStorage.removeItem(minKey);
        }
    }
    else
        localStorage.setItem(playerName, playerScore);
}

//Sort the high scores in descending order
function sortScores(){
    var arr = [];
    for(var i = 0; i < localStorage.length; i++)
        arr.push(localStorage.key(i));
    arr = mergeSort(arr, arr.length);
    return arr;
}

function mergeSort(arr, length){
    if(length == 1)
        return arr;
    var left_array = [];
    var right_array = [];
    for(var i = 0; i < parseInt(length / 2); i++)
        left_array[i] = arr[i];
    for(var i = parseInt(length / 2); i < length; i++)
        right_array[i - parseInt(length / 2)] = arr[i];

    left_array = mergeSort(left_array, left_array.length);
    right_array = mergeSort(right_array, right_array.length);
    var combined = merge(left_array, right_array);
    return combined;
}

function merge(arr1, arr2){
    var arr = [];
    var index = 0;
    var i = 0; var j = 0;
    while(i < arr1.length && j < arr2.length){
        if(parseInt(localStorage.getItem(arr1[i])) <= parseInt(localStorage.getItem(arr2[j]))){
            arr[index] = arr1[i];
            i++;
        }
        else{
            arr[index] = arr2[j];
            j++;
        }
        index++;
    }
    if(i >= arr1.length){
        for(var k = index; k < arr1.length + arr2.length; k++){
            arr[k] = arr2[j];
            j++;
        }
    }
    else if(j >= arr2.length){
        for(var k = index; k < arr1.length + arr2.length; k++){
            arr[k] = arr1[i];
            i++;
        }
    }
    return arr;
}

//Checks that syntax of ship placements is correct
function checkShips(name){
    var regexA = new RegExp(/^[Aa][:\(][A-Ja-j][1-9]0?\-[A-Ja-j][1-9]0?\)?/, 'g')
    var regexB = new RegExp(/^[Bb][:\(][A-Ja-j][1-9]0?\-[A-Ja-j][1-9]0?\)?/, 'g')
    var regexS = new RegExp(/^[Ss][:\(][A-Ja-j][1-9]0?\-[A-Ja-j][1-9]0?\)?/, 'g')

    var stayInLoop = true;

    while(stayInLoop){
        var placements = prompt("Enter ship placements for " + name);
        var array = placements.split(";");
        var air = null;
        var battle = null;
        var sub = null;
    
        for(var i = 0; i < array.length; i++){
            array[i] = array[i].trim();
            if(array[i].match(regexA) && air == null)
                air = array[i].toUpperCase();
            else if(array[i].match(regexB) && battle == null)
                battle = array[i].toUpperCase();
            else if(array[i].match(regexS) && sub == null)
                sub = array[i].toUpperCase();
            else{
                alert("Invalid syntax. Must be something similar to 'A:A1-A5;B:B6-E6;S:H3-J3'");
                break;
            }
        }
    
        if(air != null && battle != null && sub != null){
            if(air.charAt(4) === '0'){
                air = air.substring(0, 4) + air.substring(5);
                var airlocations = [air.charAt(2).charCodeAt(0) - 65, 9,
                                 air.charAt(5).charCodeAt(0) - 65, parseInt(air.substring(6), 10) - 1];
            }
            else
                airlocations = [air.charAt(2).charCodeAt(0) - 65, parseInt(air.charAt(3), 10) - 1,
                                 air.charAt(5).charCodeAt(0) - 65, parseInt(air.substring(6), 10) - 1];
            if(battle.charAt(4) === '0'){
                bat = bat.substring(0, 4) + bat.substring(5);
                var batlocations = [battle.charAt(2).charCodeAt(0) - 65, 9,
                                 battle.charAt(5).charCodeAt(0) - 65, parseInt(battle.substring(6), 10) - 1];
            }
            else
                batlocations = [battle.charAt(2).charCodeAt(0) - 65, parseInt(battle.charAt(3), 10) - 1,
                                 battle.charAt(5).charCodeAt(0) - 65, parseInt(battle.substring(6), 10) - 1];
            if(sub.charAt(4) === '0'){
                sub = sub.substring(0, 4) + sub.substring(5);
                var sublocations = [sub.charAt(2).charCodeAt(0) - 65, 9,
                                 sub.charAt(5).charCodeAt(0) - 65, parseInt(sub.substring(6), 10) - 1];
            }
            else
                sublocations = [sub.charAt(2).charCodeAt(0) - 65, parseInt(sub.charAt(3), 10) - 1,
                                 sub.charAt(5).charCodeAt(0) - 65, parseInt(sub.substring(6), 10) - 1];
            if( (airlocations[0] == airlocations[2] || airlocations[1] == airlocations[3]) &&
                (batlocations[0] == batlocations[2] || batlocations[1] == batlocations[3]) &&
                (sublocations[0] == sublocations[2] || sublocations[1] == sublocations[3]) ){
                if((airlocations[2] - airlocations[0] + airlocations[3] - airlocations[1]) == 4 &&
                   (batlocations[2] - batlocations[0] + batlocations[3] - batlocations[1]) == 3 &&
                   (sublocations[2] - sublocations[0] + sublocations[3] - sublocations[1]) == 2){
                        if(notIntersect(airlocations, batlocations) && notIntersect(airlocations, sublocations) &&
                            notIntersect(batlocations, sublocations))
                            stayInLoop = false;
                   }

                else
                    alert("Aircraft carrier must be 5 units long; battleship 4 units; submarine 3 units");
                }
            else
                alert("Aircraft carrier must be placed horizontally or vertically");
        }
    }
    return [airlocations, batlocations, sublocations];
}

//Checks if two different shapes are on at least one same tile
function notIntersect(array1, array2){
    for(var row1 = array1[0]; row1 <= array1[2]; row1++){
        for(var col1 = array1[1]; col1 <= array1[3]; col1++){
            for(var row2 = array2[0]; row2 <= array2[2]; row2++){
                for(var col2 = array2[1]; col2 <= array2[3]; col2++){
                    if(row1 === row2 && col1 === col2){
                        alert("Different ships cannot occupy same space");
                        return false;
                    }
                }
            }
        }
    }
    return true;
}