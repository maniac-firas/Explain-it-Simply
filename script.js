/* =========================================
   1. GLOBAL VARIABLES & ELEMENTS
   ========================================= */
const inputText = document.getElementById('inputText');
const simplifyBtn = document.getElementById('simplify-btn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const charCount = document.getElementById('charCount');

// State
let currentFontSize = 0; // 0 = normal, 1 = large

/* =========================================
   2. EVENT LISTENERS
   ========================================= */

// Live Character Count
inputText.addEventListener('input', function() {
    const len = this.value.length;
    charCount.innerText = `${len} / 3000 chars`;
    
    if (len > 3000) charCount.classList.add('text-red-500');
    else charCount.classList.remove('text-red-500');

    // Enable button if text > 10 chars
    const btn = document.getElementById('simplifyBtn');
    if(len > 10) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
});

// Offline Detection
window.addEventListener('offline', () => updateConnectionStatus(false));
window.addEventListener('online', () => updateConnectionStatus(true));

function updateConnectionStatus(isOnline) {
    const banner = document.getElementById('connection-banner');
    const btn = document.getElementById('simplifyBtn');
    
    if(!isOnline) {
        banner.classList.remove('-translate-y-full');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-wifi"></i> Waiting for internet...';
    } else {
        banner.classList.add('-translate-y-full');
        // Re-check input length
        if(inputText.value.length > 10) btn.disabled = false;
        btn.innerHTML = 'Simplify Text <i class="fas fa-arrow-right"></i>';
    }
}

/* =========================================
   3. TOOLBAR FUNCTIONS
   ========================================= */

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        inputText.dispatchEvent(new Event('input')); // Trigger update
        showToast("Text pasted from clipboard");
    } catch (err) {
        showToast("Please allow clipboard access or press Ctrl+V");
    }
}

function clearText() {
    inputText.value = "";
    inputText.dispatchEvent(new Event('input'));
    resultsSection.classList.add('hidden');
    document.getElementById('inputError').classList.add('hidden');
}

function fillExample() {
    const example = "The policyholder's liability for out-of-pocket expenses shall be limited to the annual deductible amount as stipulated in Section 4.2, provided that all prerequisite documentation has been submitted within the prescribed timeframe.";
    
    inputText.value = "";
    let i = 0;
    const speed = 15; // Typing speed
    
    function typeWriter() {
        if (i < example.length) {
            inputText.value += example.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            inputText.dispatchEvent(new Event('input'));
        }
    }
    typeWriter();
}

/* =========================================
   4. MAIN LOGIC: SIMPLIFY
   ========================================= */

async function handleSimplify() {
    const text = inputText.value;
    const complexity = document.getElementById('complexityLevel').value; // Get selected mode
    const errorBox = document.getElementById('inputError');
    
    // Validation
    if(text.length < 10) {
        errorBox.classList.remove('hidden');
        return;
    }
    errorBox.classList.add('hidden');

    // UI Loading State
    document.getElementById('simplifyBtn').disabled = true;
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    const loadingInterval = startLoadingMessages();

    try {
        /* ========================================================
           BACKEND INTEGRATION:
           To use real AI, uncomment this block:
           
           const response = await fetch('http://127.0.0.1:5000/simplify', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ text: text, level: complexity })
           });
           const data = await response.json();
           ======================================================== */
        
        // FOR PROTOTYPE: Using Mock Data (Sensitive to Complexity!)
        const data = await mockAPICall(text, complexity);

        // Render Results
        populateResults(data);
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        showToast("Could not connect to the simplifier.");
        loadingSection.classList.add('hidden');
        document.getElementById('simplifyBtn').disabled = false;
    } finally {
        clearInterval(loadingInterval);
    }
}

/* =========================================
   5. UI HELPERS
   ========================================= */

function populateResults(data) {
    document.getElementById('simplifiedContent').innerHTML = data.simplified;
    document.getElementById('originalContent').innerText = inputText.value;
    
    const list = document.getElementById('summaryList');
    list.innerHTML = ""; 
    
    data.keyPoints.forEach(point => {
        const li = document.createElement('li');
        // Visual Style: White Card on Green Background
        li.className = "flex items-start gap-3 bg-white p-3 rounded-lg border border-green-200 shadow-sm transition-all hover:shadow-md";
        li.innerHTML = `<i class="fas fa-check text-green-600 mt-1 shrink-0"></i> <span class="font-medium text-green-900">${point}</span>`;
        list.appendChild(li);
    });
}

function startLoadingMessages() {
    const messages = [
        "Reading your document...",
        "Identifying complex jargon...",
        "Rewriting in plain English...",
        "Extracting key points...",
        "Finalizing summary..."
    ];
    let i = 0;
    const loaderMsg = document.getElementById('loaderText');
    return setInterval(() => {
        loaderMsg.innerText = messages[i % messages.length];
        i++;
    }, 1200);
}

function adjustFontSize(change) {
    const body = document.getElementById('app-body');
    if(change === 1) body.classList.add('text-large');
    else body.classList.remove('text-large');
}

function toggleView(mode) {
    const simpleDiv = document.getElementById('simplifiedContent');
    const originalDiv = document.getElementById('originalContent');
    const btnSimple = document.getElementById('btn-simple');
    const btnOriginal = document.getElementById('btn-original');
    const title = document.getElementById('resultTitle');

    if (mode === 'simplified') {
        simpleDiv.classList.remove('hidden');
        originalDiv.classList.add('hidden');
        btnSimple.className = "px-6 py-2 rounded-lg text-sm font-bold bg-white text-green-700 shadow-sm transition-all border border-gray-100";
        btnOriginal.className = "px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 transition-all border border-transparent";
        title.innerText = "Plain English Version";
    } else {
        simpleDiv.classList.add('hidden');
        originalDiv.classList.remove('hidden');
        btnOriginal.className = "px-6 py-2 rounded-lg text-sm font-bold bg-white text-green-700 shadow-sm transition-all border border-gray-100";
        btnSimple.className = "px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 transition-all border border-transparent";
        title.innerText = "Original Complex Text";
    }
}

function copyToClipboard() {
    const content = document.getElementById('simplifiedContent').innerText;
    navigator.clipboard.writeText(content);
    
    const icon = document.getElementById('copyIcon');
    icon.className = "fas fa-check";
    showToast("Text copied to clipboard!");
    
    setTimeout(() => {
        icon.className = "far fa-copy";
    }, 2000);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

/* =========================================
   6. MOCK API (SMART DEMO)
   ========================================= */
function mockAPICall(text, complexity) {
    return new Promise(resolve => {
        
        // DEMO LOGIC: Change output based on the drop-down selection!
        let simplifiedText = "";
        let bulletPoints = [];

        if (complexity === 'child') {
            // Child Mode
            simplifiedText = `
                <p class="mb-4 font-bold text-green-700 bg-green-50 p-2 rounded-lg inline-block border border-green-100"><i class="fas fa-child"></i> Explained for a 10-year-old:</p>
                <p class="mb-4">Imagine you have a piggy bank for doctor visits. You have to pay for your own boo-boos until you spend a certain amount of money. This amount is called a <span class="highlight-important" title="Money you pay first">deductible</span>.</p>
                <p>Once you have paid that amount, we will pay for the rest! But you must send us your homework (paperwork) on time.</p>
            `;
            bulletPoints = [
                "You pay from your piggy bank first.",
                "Send your homework on time.",
                "We pay after you reach your limit."
            ];
        } else {
            // Standard/Professional Mode
            simplifiedText = `
                <p class="mb-4">You only have to pay for your own medical costs up to your <span class="highlight-important" title="The max amount you pay before insurance helps">yearly deductible limit</span>.</p>
                <p class="mb-4">This rule applies as long as you send us the <span class="highlight-important" title="Forms like receipts and claims">required paperwork</span> before the deadline.</p>
                <p>Basically, once you pay that set amount, we cover the rest.</p>
            `;
            bulletPoints = [
                "You pay costs until you reach your deductible.",
                "Paperwork must be submitted on time.",
                "Insurance coverage starts after the limit is reached."
            ];
        }

        setTimeout(() => {
            resolve({
                simplified: simplifiedText,
                keyPoints: bulletPoints
            });
        }, 2000); // 2 second delay to simulate AI thinking
    });
}