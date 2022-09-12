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
        itemName.push(items[i].Name);
    }
    for (var i = 0; i < recipies.length; i++)
    {
        recipiesResultID.push(Number(recipies[i]["Item{Result}"]));
    }
};

async function getItemPrice(world, itemID, amount) {

    const response = await fetch("https://universalis.app/api/v2/" + world + "/" + itemID + "?listings=10");
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
    var index = itemName.indexOf(item);
    return index+1
}

//stolen from stack overflow
// fucked if you use it on things with numerals
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
                var item = items[recipies[index]["Item{Ingredient}["+i+"]"]-1].Name;
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

async function getRecipePrice(world, recipe, amountToMake) {
    console.log(recipe);
    function forEachFunct(item, index) {
        var itemPriceArr = getItemPrice(world, searchForItemID(item[0]), item[1]);
        if (itemPriceArr.length < item[1])
    }
    recipe.forEach(forEachFunct);
    
}




async function buttonClick() {
    var word = document.getElementById("input").value;
    var itemID = searchForItemID(word);
    var recipe = craftingRecipe(itemID);
    getRecipePrice("crystal", recipe, 1);
    //console.log(await getItemPrice("crystal", itemID, 5));
    document.getElementById("output").innerHTML = word + " has the item ID of " + itemID + "\nThe crafting recipe is " + recipe;
    //console.log(items);
    //var itemData = JSON.parse(Item);
    //console.log(itemData[0]);
}

