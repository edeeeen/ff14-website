var itemName = [];
var items = [];
var recipies = [];
var recipiesResultID = [];

function autoComplete(){
    
}

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
    for (var i = 0; i < items.length; i++)
    {
        itemName.push(items[i].Singular.toLowerCase());
    }
    for (var i = 0; i < recipies.length; i++)
    {
        recipiesResultID.push(Number(recipies[i]["Item{Result}"]));
    }
};

async function getItemPrice(world, itemID, amount) {

    const response = await fetch("https://universalis.app/api/v2/" + world + "/" + itemID + "?listings=20");
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
    return index+1
}

//stolen from stack overflow
// fucked if you use it on things with numerals (materia)
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};


function craftingRecipe(itemID){
    index = recipiesResultID.indexOf(itemID);
    if(index == -1) {
        return "Error, not craftable";
    } else {
        var itemList = [];
        for(var i = 0; i < 10; i++) {
            try {
                var item = items[recipies[index]["Item{Ingredient}["+i+"]"]-1].Singular.toLowerCase();
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
async function getRecipePrice(world, recipe, amountToMake) {
    var totalPrice = 0;
    for (let item of recipe) {
        var total = item[1]*amountToMake;
        var itemPriceArr = await getItemPrice(world, searchForItemID(item[0]), total);
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
    }
    return totalPrice;
}


async function buttonClick() {
    var word = document.getElementById("input").value;
    var itemID = searchForItemID(word);
    var price = await getItemPrice("crystal", itemID, 1);
    if (recipiesResultID.indexOf(itemID) == -1) {
        document.getElementById("output").innerHTML = word + " is not craftable, however sells for " + price[0] + " gil"  ;
    } else {
        var recipe = craftingRecipe(itemID);
        var total =  await getRecipePrice("crystal", recipe, 1);
        console.log(price[0]);
        document.getElementById("output").innerHTML = word + " costs " + total + " gil to craft if it is all NQ That is a " + (price[0]-total) + " gil profit";
    }
    document.getElementById('image1').src='https://universalis-ffxiv.github.io/universalis-assets/icon2x/'+ itemID +'.png';
    document.getElementById('image1').width=70;
    document.getElementById('text1').innerHTML = word;
}