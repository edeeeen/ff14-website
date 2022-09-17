var itemName = [];
var items = [];
var recipies = [];
var recipiesResultID = [];

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

function craftingRecipe(itemID){
    index = recipiesResultID.indexOf(itemID);
    if(index == -1) {
        return "Error, not craftable";
    } else {
        var itemList = [];
        for(var i = 0; i < 10; i++) {
            try {
                var item = items[recipies[index]["Item{Ingredient}["+i+"]"]-1].Name.toLowerCase();
                var amount = recipies[index]["Amount{Ingredient}["+i+"]"];
            }
            catch {
                break;
            }
            itemList.push([item, amount]);
        }
        //console.log(itemList);
        return itemList;
    }

}
//finds the total price of the recipe
async function getRecipePrice(world, recipe, amountToMake, HQ = null) {
    var totalPrice = 0;
    var x = 0;
    for (let item of recipe) {
        var total = item[1]*amountToMake;
        if (HQ == null) {
            var itemPriceArr = await getItemPrice(world, searchForItemID(item[0]), total);
        } else {
            var itemPriceArr = await getItemPrice(world, searchForItemID(item[0]), total, HQ[x]);
        }
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


async function buttonClick() {
    var word = document.getElementById("input").value;
    var itemID = searchForItemID(word);
    console.log(itemID);
    var price = await getItemPrice("crystal", itemID, 1);
    if (recipiesResultID.indexOf(itemID) == -1) {
        document.getElementById("output").innerText = word + " is not craftable, however sells for " + price[0] + " gil"  ;
        document.getElementById('img1').src = 'https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ itemID +'.png';
        document.getElementById("name1").innerText =  items[itemID-1].Name;
        document.getElementById("gil1").innerText = price[0] + " gil";
        console.log(itemID);
    } else {
        var recipe = craftingRecipe(itemID);
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
            var tempID = searchForItemID(recipe[i][0]);
            var itemPrice = await getItemPrice("crystal", tempID, 1)
            var row = table.insertRow(i);
            row.className = "tableDeletion";
            //is there a better way to do this? prolly
            for (var x = 0; x < 5; x++) {
                var cell = row.insertCell(x);
                cell.className = "tableDeletion"
                switch(x) {
                    case 0:
                        //Clicker boy
                        var checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        //checkbox.name = "name";
                        //checkbox.value = "value";
                        checkbox.className = "checkboxIn";
                        checkbox.id = items[tempID-1]["Name"];
                        checkbox.setAttribute("onchange", "checkboxClick(" + recipe + ",'"  + items[tempID-1]["Name"] + "')");
                        cell.appendChild(checkbox);
                        break;
                    case 1:
                        //img
                        var image = document.createElement('img');
                        image.width = "80";
                        image.src = 'https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ tempID +'.png';
                        cell.appendChild(image);
                        break;
                    case 2:
                        //amount
                        var amount = document.createElement('p');
                        amount.innerText = recipe[i][1];
                        amount.className = "pInTable";
                        cell.appendChild(amount);
                        break;
                    case 3:
                        //name
                        var name = document.createElement('p');
                        name.innerText = items[tempID-1]["Name"];
                        name.className = "pInTable";
                        name.id = items[tempID-1]["Name"];
                        cell.appendChild(name);
                        break;
                    case 4:
                        //gil
                        var gil = document.createElement('p');
                        gil.innerText = (itemPrice[0] * recipe[i][1]) + " gil";
                        gil.className = "pInTable";
                        gil.id = items[tempID-1]["Name"];
                        cell.appendChild(gil);
                        break;
                    default:
                        throw 'Error idk how you did that';
                }
            }
        }
    }     
}

function checkboxClick(recipe, name) {
    document.getElementById(name).innerText="lawl";
}