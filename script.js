// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meal-details");
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");


const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`;
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`;
const RANDOM_URL = `${BASE_URL}random.php`;


searchBtn.addEventListener("click", searchMeals);
mealsContainer.addEventListener("click", handleMealClick);
backBtn.addEventListener("click", () => mealDetails.classList.add("hidden"));
searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") searchMeals();
});

// Show random recipes feed on page load
window.addEventListener("DOMContentLoaded", showRandomFeed);

// Optional: Add a refresh button for random feed
let randomFeedBtn = document.createElement("button");
randomFeedBtn.textContent = "Show More Random Recipes";
randomFeedBtn.className = "random-feed-btn";
randomFeedBtn.addEventListener("click", showRandomFeed);
mealsContainer.parentNode.insertBefore(randomFeedBtn, mealsContainer.nextSibling);
// Show a feed of random recipes
async function showRandomFeed() {
    resultHeading.textContent = "Random Recipes For You:";
    mealsContainer.innerHTML = "";
    errorContainer.classList.add("hidden");
    let randomMeals = [];
    let mealIds = new Set();
    // Fetch 8 unique random meals
    while (randomMeals.length < 8) {
        try {
            const res = await fetch(RANDOM_URL);
            const data = await res.json();
            if (data.meals && data.meals[0] && !mealIds.has(data.meals[0].idMeal)) {
                randomMeals.push(data.meals[0]);
                mealIds.add(data.meals[0].idMeal);
            }
        } catch (e) {
            break;
        }
    }
    displayMeals(randomMeals);
}

async function searchMeals() {
    const searchTerm = searchInput.value.trim();
    if(!searchTerm) {
        errorContainer.textContent = "Please enter a search term.";
        errorContainer.classList.remove("hidden");
        return;
    }
    try {
        resultHeading.textContent = `Searching for "${searchTerm}"...`;
        mealsContainer.innerHTML = "";
        errorContainer.classList.add("hidden");

        // Fetch meals from API
        const response = await fetch(`${SEARCH_URL}${searchTerm}`);
        const data = await response.json();

        console.log("Data is here:", data);

        if(data.meals === null) {
            resultHeading.textContent = ``;
            mealsContainer.innerHTML = "";
            errorContainer.textContent = `No recipes found for "${searchTerm}". Try another search term!`;
            errorContainer.classList.remove("hidden");
        } else {
            resultHeading.textContent = `Search results for "${searchTerm}":`;
            displayMeals(data.meals);
            searchInput.value = "";
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}

function displayMeals(meals) {
    mealsContainer.innerHTML = "";

    meals.forEach((meal) => {
    mealsContainer.innerHTML += `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3 class="meal-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
        </div>
      </div>
    `;
  });
}

async function handleMealClick(e) {
    const mealEl = e.target.closest(".meal");
    if (!mealEl) return;
    const mealId = mealEl.getAttribute("data-meal-id");
    try {
        const response = await fetch(`${LOOKUP_URL}${mealId}`);
        const data = await response.json();
        
        console.log(data);

        if(data.meals && data.meals[0]) {
            const meal = data.meals[0];

            const ingredients = [];
            for(let i = 1; i <= 20; i++) {
                if(meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
                    ingredients.push({
                        ingredient: meal[`strIngredient${i}`],
                        measure: meal[`strMeasure${i}`]
                    });
                }
            }
             
            // Fetch recommended recipes (random meals)
            let recommendedHTML = "";
            try {
                const recRes = await fetch(`${BASE_URL}random.php`);
                const recData = await recRes.json();
                if (recData.meals && recData.meals.length > 0) {
                    recommendedHTML = `
                    <div class="recommended-recipes">
                        <h3>Recommended Recipe</h3>
                        <div class="recommended-list">
                            ${recData.meals
                                .map(
                                    (rec) => `
                                        <div class="recommended-item" data-meal-id="${rec.idMeal}">
                                            <img src="${rec.strMealThumb}" alt="${rec.strMeal}" />
                                            <div class="recommended-title">${rec.strMeal}</div>
                                        </div>
                                    `
                                )
                                .join("")}
                        </div>
                    </div>
                    `;
                }
            } catch (e) {
                // ignore recommended fetch errors
            }

            mealDetailsContent.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
        <h2 class="meal-details-title">${meal.strMeal}</h2>
        <div class="meal-details-category">
          <span>${meal.strCategory || "Uncategorized"}</span>
        </div>
        <div class="meal-details-instructions">
          <h3>Instructions</h3>
          <p>${meal.strInstructions}</p>
        </div>
        <div class="meal-details-ingredients">
          <h3>Ingredients</h3>
          <ul class="ingredients-list">
            ${ingredients
              .map(
                (item) => `
              <li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>
            `
              )
              .join("")}
          </ul>
        </div>
        ${
          meal.strYoutube
            ? `
          <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
            <i class="fab fa-youtube"></i> Watch Video
          </a>
        `
            : ""
        }
        ${recommendedHTML}
      `;
        mealDetails.classList.remove("hidden");
        mealDetails.scrollIntoView({ behavior: "smooth" });
        }
        // Add click event for recommended recipe
        const recList = mealDetailsContent.querySelector('.recommended-list');
        if (recList) {
            recList.addEventListener('click', function(ev) {
                const recEl = ev.target.closest('.recommended-item');
                if (recEl) {
                    // Simulate click on recommended recipe
                    handleMealClick({ target: recEl });
                }
            });
        }
    } catch (error) {
        // Optionally handle error
    }
}
