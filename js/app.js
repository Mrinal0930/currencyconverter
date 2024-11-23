// Base URLs for the primary and fallback APIs
let BASE_URL_PRIMARY =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
let BASE_URL_FALLBACK = "https://api.exchangerate.host/latest";

// Get elements from the DOM
const dropdowns = document.querySelectorAll(".dropdown select");
const amountInput = document.querySelector(".amount input");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msgDiv = document.querySelector(".msg");

// Populate dropdowns with currency options
for (let select of dropdowns) {
  for (currCode in countryList) {
    let newOption = document.createElement("option");
    newOption.innerText = currCode; // Display the currency code
    newOption.value = currCode; // Set the value to the currency code
    if (select.name === "from" && currCode === "USD") {
      newOption.selected = "selected"; // Default "from" currency
    } else if (select.name === "to" && currCode === "INR") {
      newOption.selected = "selected"; // Default "to" currency
    }
    select.append(newOption); // Append the option to the dropdown
  }
  // Add an event listener to update the flag when currency changes
  select.addEventListener("change", (evt) => {
    updateFlag(evt.target);
    fetchExchangeRate(); // Fetch the exchange rate when the dropdown changes
  });
}

// Update the country flag based on the selected currency
const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode]; // Get the country code for the currency
  let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`; // Construct the flag image URL
  let img = element.parentElement.querySelector("img"); // Find the img element
  img.src = newSrc; // Update the image source
};

// Fetch exchange rate from APIs
const fetchExchangeRate = async () => {
  const amtVal = parseFloat(amountInput.value.trim()); // Get and trim the input value

  // Check if the value is valid (positive number)
  if (isNaN(amtVal) || amtVal < 1) {
    msgDiv.textContent =
      "Please enter a valid amount greater than or equal to 1.";
    return;
  }

  try {
    // First attempt with the primary API
    const rate = await getExchangeRate(BASE_URL_PRIMARY);
    displayExchangeRate(rate, amtVal);
  } catch (primaryError) {
    console.warn("Primary API failed, trying fallback:", primaryError.message);

    try {
      // Attempt with the fallback API
      const rate = await getExchangeRate(BASE_URL_FALLBACK, true);
      displayExchangeRate(rate, amtVal);
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError.message);
      alert("Failed to fetch exchange rate. Please try again later.");
    }
  }
};

// Event listener for the input field
amountInput.addEventListener("input", () => {
  const inputValue = parseFloat(amountInput.value.trim());

  // Only call the API if the value is valid
  if (!isNaN(inputValue) && inputValue >= 1) {
    fetchExchangeRate();
  }
});

// Get exchange rate from the selected API
const getExchangeRate = async (baseUrl, isFallback = false) => {
  if (isFallback) {
    // Fetch exchange rate from the fallback API
    const response = await fetch(
      `${baseUrl}?base=${fromCurr.value}&symbols=${toCurr.value}`
    );
    if (!response.ok) {
      throw new Error(`Fallback API failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.rates[toCurr.value]; // Return the exchange rate
  } else {
    // Fetch exchange rate from the primary API
    const response = await fetch(
      `${baseUrl}/${fromCurr.value.toLowerCase()}.json`
    );
    if (!response.ok) {
      throw new Error(`Primary API failed with status ${response.status}`);
    }
    const data = await response.json();
    return data[fromCurr.value.toLowerCase()][toCurr.value.toLowerCase()];
  }
};

// Display the exchange rate in the UI
const displayExchangeRate = (rate, amtVal) => {
  if (!rate) {
    alert(`Exchange rate not found for ${fromCurr.value} to ${toCurr.value}`);
    return;
  }

  // Calculate the converted amount
  const convertedAmount = (amtVal * rate).toFixed(2);

  // Update the message in the UI
  msgDiv.textContent = `${amtVal} ${fromCurr.value} = ${convertedAmount} ${toCurr.value}`;
};
// Add event listeners for real-time updates
amountInput.addEventListener("input", fetchExchangeRate); // Trigger on amount change
document.addEventListener("DOMContentLoaded", fetchExchangeRate); // Trigger on page load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // Prevent form submission on pressing Enter
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  // Existing logic
  fetchExchangeRate();
});
