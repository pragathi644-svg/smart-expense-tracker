
let expenseChart = null;

const form = document.getElementById("expenseForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expenseList");
const filterCategory = document.getElementById("filterCategory");
const searchExpense = document.getElementById("searchExpense");

const totalSpent = document.getElementById("totalSpent");
const monthlyBudget = document.getElementById("monthlyBudget");
const budgetInput = document.getElementById("budgetInput");
const updateBudgetBtn = document.getElementById("updateBudgetBtn");
const budgetMessage = document.getElementById("budgetMessage");
const remainingBudget = document.getElementById("remainingBudget");

let BUDGET = Number(localStorage.getItem("monthlyBudget")) || 10000;
let expenses = [];

try {
    const savedExpenses = JSON.parse(
        localStorage.getItem("smartExpenses") || "[]"
    );

    if (Array.isArray(savedExpenses)) {
        expenses = savedExpenses.filter(expense =>
            expense &&
            typeof expense.description === "string" &&
            typeof expense.amount === "number" &&
            Number.isFinite(expense.amount) &&
            expense.amount > 0 &&
            typeof expense.category === "string" &&
            typeof expense.date === "string" &&
            typeof expense.id === "string"
        );
    }
} catch {
    expenses = [];
}

function getToday() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

dateInput.value = getToday();

function money(amount) {
    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}

function saveExpenses() {
    try {
        localStorage.setItem("smartExpenses", JSON.stringify(expenses));
    } catch {
        alert("Could not save data in this browser.");
    }
}

function renderExpenses() {
    const total = expenses.reduce(
        (sum, expense) => sum + expense.amount, 0
    );

    totalSpent.textContent = money(total);
    monthlyBudget.textContent = money(BUDGET);
    remainingBudget.textContent = money(BUDGET - total);

    remainingBudget.style.color =
        total > BUDGET ? "#b42318" : "#176b45";
        const budgetWarning = document.getElementById("budgetWarning");

if (total > BUDGET) {
    budgetWarning.textContent =
        "⚠️ Budget exceeded! You have spent more than ₹10,000.";
    budgetWarning.hidden = false;
    budgetWarning.style.color = "#b42318";
} else if (total >= BUDGET * 0.8) {
    budgetWarning.textContent =
        "⚠️ Budget alert! You have used 80% or more of your monthly budget.";
    budgetWarning.hidden = false;
    budgetWarning.style.color = "#9a6700";
} else {
    budgetWarning.textContent = "";
    budgetWarning.hidden = true;
}

    // Search and category filter
    const selectedCategory = filterCategory.value;
    const searchText = searchExpense.value.toLowerCase().trim();

    const filteredExpenses = expenses.filter(expense => {
        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const matchesSearch =
            expense.description.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    // Spending chart
    const categories = [
        "Food", "Travel", "Shopping",
        "Education", "Bills", "Other"
    ];

    const categoryTotals = categories.map(category =>
        expenses
            .filter(expense => expense.category === category)
            .reduce((sum, expense) => sum + expense.amount, 0)
    );

    const chartCanvas = document.getElementById("expenseChart");

    if (chartCanvas && window.Chart) {
        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(chartCanvas, {
            type: "doughnut",
            data: {
                labels: categories,
                datasets: [{
                    data: categoryTotals,
                    backgroundColor: [
                        "#27845B", "#4D8FD6", "#E8B44A",
                        "#9370DB", "#E47C63", "#91A39A"
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }

    // Expense history
    expenseList.replaceChildren();

    if (filteredExpenses.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = expenses.length === 0
            ? "No expenses yet. Add your first expense!"
            : "No matching expenses found.";

        expenseList.appendChild(message);
        return;
    }

    filteredExpenses.slice().reverse().forEach(expense => {
        const item = document.createElement("div");
        item.className = "expense-item";

        const details = document.createElement("div");
        details.className = "expense-details";

        const title = document.createElement("h3");
        title.textContent = expense.description;

        const info = document.createElement("p");
        info.textContent = `${expense.category} • ${expense.date}`;
        details.append(title, info);

        const right = document.createElement("div");
        right.className = "expense-right";

        const amount = document.createElement("span");
        amount.className = "expense-amount";
        amount.textContent = money(expense.amount);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            expenses = expenses.filter(
                saved => saved.id !== expense.id
            );
            saveExpenses();
            renderExpenses();
        });

        right.append(amount, deleteButton);
        item.append(details, right);
        expenseList.appendChild(item);
    });
}

// Add a new expense
form.addEventListener("submit", event => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || !Number.isFinite(amount) ||
        amount <= 0 || !date) {
        alert("Please enter a valid expense name, amount, and date.");
        return;
    }

    const expense = {
        id: `${Date.now()}-${Math.random()}`,
        description,
        amount,
        category,
        date
    };

    expenses.push(expense);
    saveExpenses();

    form.reset();
    dateInput.value = getToday();

    renderExpenses();
});

filterCategory.addEventListener("change", renderExpenses);
searchExpense.addEventListener("input", renderExpenses);

renderExpenses();
// Set the budget input to the saved budget
budgetInput.value = BUDGET;

// Update monthly budget
updateBudgetBtn.addEventListener("click", () => {
    const newBudget = Number(budgetInput.value);

    if (!Number.isFinite(newBudget) || newBudget <= 0) {
        budgetMessage.textContent = "Please enter a valid budget greater than ₹0.";
        budgetMessage.style.color = "#b42318";
        return;
    }

    BUDGET = newBudget;
    localStorage.setItem("monthlyBudget", String(BUDGET));

    budgetMessage.textContent = "Monthly budget updated successfully!";
    budgetMessage.style.color = "#176b45";

    renderExpenses();
});