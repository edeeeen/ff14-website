var itemName = [];
var items = [];
var recipies = [];
var recipiesResultID = [];
var recipe;

async function getData(jsonURL) {
   //load up the JSON and send it back as a string
   //this is slow and needs to be optimized when i want to learn about it
   //you can probably run this at the same time as another fetch and grab them both at the same time
   //idk tho im an idiot
    const response = await fetch(jsonURL);
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const itemListJson = await response.json();
    return JSON.stringify(itemListJson);
}

window.onload = async function() {
    items = JSON.parse(await getData("data/Item.json"));
    recipies = JSON.parse(await getData("data/Recipe.json"));
    for (var i = 0; i < items.length; i++) {
        itemName.push(items[i].Name.toLowerCase());
    }
    for (var i = 0; i < recipies.length; i++) {
        recipiesResultID.push(Number(recipies[i]["Item{Result}"]));
    }
};

async function getItemPrice(world, itemID, amount, HQ = false) {
    const response = await fetch("https://universalis.app/api/v2/" + world + "/" + itemID + "?listings=20" + "&hq=" + HQ);
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const marketBoard = await response.json();
    var count = 0;
    var returnArr = [];
    //search thru the top 10 listings and make 2d array to return
    //[price, quantity, id]
    for (var i = 0; i < 10; i++) {
        // wouldnt work with an or in the for loop for some reason
        if (count >= amount){
            break;
        }
        count += marketBoard.listings[i]["quantity"];
        returnArr.push(marketBoard.listings[i]["pricePerUnit"], marketBoard.listings[i]["quantity"], marketBoard.listings[i]["worldID"]);
    }
    return returnArr;
    
}

function searchForItemID(item) {
    var index = itemName.indexOf(item.toLowerCase());
    return index+1;
}

async function craftingRecipe(itemID){
    index = recipiesResultID.indexOf(itemID);
    if(index == -1) {
        return "Error, not craftable";
    } else {
        var itemList = [];
        for(var i = 0; i < 10; i++) {
            try {
                var itemID = recipies[index]["Item{Ingredient}["+i+"]"];
                var item = items[recipies[index]["Item{Ingredient}["+i+"]"]-1].Name.toLowerCase();
                var amount = recipies[index]["Amount{Ingredient}["+i+"]"];
                var price = await getItemPrice("crystal", itemID, 1);
                price = price[0];
            }
            catch {
                break;
            }
            itemList.push([itemID, item, amount, price, false]);
        }
        //console.log(itemList);
        return itemList;
    }

}


//finds the total price of the recipe
async function getRecipePrice(world, recipe, amountToMake) {
    var totalPrice = 0;
    var x = 0;
    for (let item of recipe) {
        //NEED TO CHECK IF THERE ARE NO LISTINGS!!
        //

        var total = item[1]*amountToMake;
        var itemPriceArr = await getItemPrice(world, item[0], total, item[4]);
        //count to the total with this
        var countingTotal = 0;
        var i = 1;
        do {
            //console.log(itemPriceArr[i]);
            if (itemPriceArr[i] > total-countingTotal) {
                totalPrice += itemPriceArr[i-1] * (total-countingTotal);
                //console.log("in price for 1: " + itemPriceArr[i-1]);
                //console.log("in " + itemPriceArr[i-1] * (total-countingTotal));
            } else {
                totalPrice += itemPriceArr[i-1] * itemPriceArr[i];
                countingTotal += itemPriceArr[i];
                //console.log("regular gil:" + itemPriceArr[i-1] * itemPriceArr[i] + "   amount:" + itemPriceArr[i]);
            }
            
            i += 3;
        } while(i < itemPriceArr.length);
        x++
    }
    return totalPrice;
}

function updateTable(recipe) {
    //at this point recipe will look like [name, amount, quality, price]

}


async function buttonClick() {
    var word = document.getElementById("input").value;
    var itemID = searchForItemID(word);
    console.log(itemID);
    //check if they want it to be HQ
    if (document.getElementById("hqCheckbox").value == "on") {
        //HQ
        var price = await getItemPrice("crystal", itemID, 1, true);
    } else {
        //NQ
        var price = await getItemPrice("crystal", itemID, 1);
    }
    //check if it is craftable
    if (recipiesResultID.indexOf(itemID) == -1) {
        document.getElementById("output").innerText = word + " is not craftable, however sells for " + price[0] + " gil"  ;
        document.getElementById('img1').src = 'https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ itemID +'.png';
        document.getElementById("name1").innerText =  items[itemID-1].Name;
        document.getElementById("gil1").innerText = price[0] + " gil";
        console.log(itemID);
    } else {
        recipe = await craftingRecipe(itemID);
        console.log(recipe);
        var total =  await getRecipePrice("crystal", recipe, 1);
        document.getElementById("output").innerText = word + " costs " + total + " gil to craft if it is all NQ That is a " + (price[0]-total) + " gil profit";
        document.getElementById('img1').src = 'https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ itemID +'.png';
        document.getElementById("name1").innerText = items[itemID-1].Name;
        document.getElementById("gil1").innerText = price[0] + " gil";
        var table = document.getElementById("table2");
        console.log(recipe);
        
        var w, elements = document.getElementsByClassName('tableDeletion');
        for (w = elements.length; w--;) {         
            elements[w].parentNode.removeChild(elements[w]);             
        }
        
        for (var i = 0; i < recipe.length; i++) {
            var row = table.insertRow(i);
            row.className = "tableDeletion";
            //is there a better way to do this? prolly
            for (var x = 0; x < 5; x++) {
                var cell = row.insertCell(x);
                cell.className = "tableDeletion"
                switch(x) {
                    case 0:
                        //Clicker box
                        //Will change to a button
                        var checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        //checkbox.name = "name";
                        //checkbox.value = "value";
                        checkbox.className = "checkboxIn";
                        //checkbox.id = items[tempID-1]["Name"];
                        checkbox.setAttribute("onchange", "checkboxClick("+ recipe[i][0] + ")");
                        cell.appendChild(checkbox);
                        break;
                    case 1:
                        //img
                        var image = document.createElement('img');
                        image.width = "80";
                        image.src = 'https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ recipe[i][0] +'.png';
                        cell.appendChild(image);
                        break;
                    case 2:
                        //amount
                        var amount = document.createElement('p');
                        amount.innerText = recipe[i][2];
                        amount.className = "pInTable";
                        cell.appendChild(amount);
                        break;
                    case 3:
                        //name
                        var itemName = items[recipe[i][0]-1]["Name"];
                        var name = document.createElement('p');
                        name.innerText = itemName;
                        name.className = "pInTable";
                        name.id = itemName;
                        var image = document.createElement("img");
                        image.id = itemName + "img";
                        image.className = "HQimage";
                        cell.appendChild(name);
                        cell.appendChild(image);
                        break;
                    case 4:
                        //gil
                        var gil = document.createElement('p');
                        gil.innerText = (recipe[i][3] * recipe[i][2]) + " gil";
                        gil.className = "pInTable";
                        gil.id = items[recipe[i][0]-1]["Name"] + "gil";
                        cell.appendChild(gil);
                        break;
                    default:
                        throw 'Error idk how you did that';
                }
            }
        }
    }     
}


//this is going to change to a button
async function checkboxClick(itemID) {
    console.log(itemID);
    var itemName = items[itemID-1].Name;    
    if (document.getElementById(itemName + "img").hasAttribute("src")) {
        //HQ
        var HQprice = await getItemPrice("crystal", itemID, 1, true)
        document.getElementById(itemName + "gil").innerText = HQprice[0] + " gil";
        document.getElementById(itemName + "img").removeAttribute("src");
        document.getElementById(itemName + "img").setAttribute("style", "");
    } else {
        //NQ
        var NQprice = await getItemPrice("crystal", itemID, 1, false)
        document.getElementById(itemName + "gil").innerText = NQprice[0] + " gil";
        document.getElementById(itemName + "img").setAttribute("src", "https://img.finalfantasyxiv.com/lds/h/G/excekDM0jBJRSF6eLahmhR7Yys.png")
        document.getElementById(itemName + "img").setAttribute("style", "height: 20px");
    }
}