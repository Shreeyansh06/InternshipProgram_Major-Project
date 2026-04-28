// GreenChain Improved - JavaScript
// Web3 Integration + UI Interactions

// ===================================
// Configuration
// ===================================
const CONFIG = {
    NETWORK: {
        chainId: '0x13882',
        chainName: 'Polygon Amoy',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        blockExplorer: 'https://www.oklink.com/amoy'
    },
    CONTRACTS: {
        // These will be filled after deployment
        CARB_TOKEN: '0x...', // Replace with your deployed token address
        MARKETPLACE: '0x...' // Replace with your deployed marketplace address
    },
    TOKEN_PRICE: 0.50 // ₹0.50 per CARB
};

// ===================================
// State Management
// ===================================
let web3;
let userAccount;
let carbTokenContract;
let marketplaceContract;

// ===================================
// Initialize Particles.js Background
// ===================================
if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#4CAF50' },
            shape: { type: 'circle' },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#4CAF50',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            }
        },
        retina_detect: true
    });
}

// ===================================
// Web3 Wallet Connection
// ===================================
document.getElementById('connectWalletBtn').addEventListener('click', async () => {
    // Disconnect if already connected
    if (userAccount) {
        disconnectWallet();
        return;
    }

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            userAccount = accounts[0];
            web3 = new Web3(window.ethereum);

            const chainId = await web3.eth.getChainId();
            if (chainId !== 80002) {
                await switchNetwork();
            }

            updateWalletUI(userAccount);
            await loadBalance();
            showToast('Wallet Connected!', 'success');

        } catch (error) {
            console.error('Connection error:', error);
            showToast('Failed to connect wallet', 'error');
        }
    } else {
        showToast('Please install MetaMask!', 'error');
        window.open('https://metamask.io/download/', '_blank');
    }
});

function disconnectWallet() {
    userAccount = null;
    web3 = null;
    const btn = document.getElementById('connectWalletBtn');
    btn.querySelector('span').textContent = 'Connect Wallet';
    btn.classList.remove('connected');
    updateBalance(0);
    showToast('Wallet disconnected', 'success');
}

// Switch to Mumbai Network
async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.NETWORK.chainId }],
        });
    } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: CONFIG.NETWORK.chainId,
                    chainName: CONFIG.NETWORK.chainName,
                    rpcUrls: [CONFIG.NETWORK.rpcUrl],
                    blockExplorerUrls: [CONFIG.NETWORK.blockExplorer],
                    nativeCurrency: {
                        name: 'POL',
                        symbol: 'POL',
                        decimals: 18
                    }
                }]
            });
        }
    }
}

// Update Wallet UI
function updateWalletUI(address) {
    const btn = document.getElementById('connectWalletBtn');
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    btn.querySelector('span').textContent = shortAddress;
    btn.classList.add('connected');
}

// Load Balance
async function loadBalance() {
    // For demo purposes, simulate balance
    const demoBalance = 142.5;
    updateBalance(demoBalance);
    
    // In production, fetch from contract:
    // const balance = await carbTokenContract.methods.balanceOf(userAccount).call();
    // updateBalance(web3.utils.fromWei(balance, 'ether'));
}

// Update Balance Display
function updateBalance(carbAmount) {
    document.getElementById('walletBalance').textContent = carbAmount.toFixed(1);
    const fiatValue = (carbAmount * CONFIG.TOKEN_PRICE).toFixed(2);
    document.getElementById('fiatValue').textContent = fiatValue;
}

// Refresh Balance
async function refreshBalance() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.style.transform = 'rotate(360deg)';
    
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
        loadBalance();
        showToast('Balance refreshed!', 'success');
    }, 1000);
}

// ===================================
// Modal Management
// ===================================
let currentAction = '';

function openEarnModal(actionType) {
    currentAction = actionType;
    const modal = document.getElementById('earnModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    
    const actions = {
        'transport': { icon: '🚌', title: 'Log Public Transport' },
        'tree': { icon: '🌳', title: 'Upload Tree Planting Proof' },
        'solar': { icon: '☀️', title: 'Connect Solar Panel Data' },
        'route': { icon: '🚛', title: 'Log Eco-Friendly Route' }
    };
    
    modalIcon.textContent = actions[actionType].icon;
    modalTitle.textContent = actions[actionType].title;
    
    // Reset states
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('verificationResult').style.display = 'none';
    
    modal.classList.add('show');
}

function closeEarnModal() {
    document.getElementById('earnModal').classList.remove('show');
}

// ===================================
// File Upload & AI Verification
// ===================================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show loading
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
            <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
                AI Verifying...
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">
                Analyzing image with Vertex AI & Gemini
            </div>
            <div style="margin-top: 1.5rem;">
                <div class="progress-bar" style="width: 100%; height: 4px; background: var(--gray-100); border-radius: 2px; overflow: hidden;">
                    <div class="progress-fill" style="height: 100%; background: var(--gradient-hero); width: 0%; animation: progress 2s ease-out forwards;"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    // Simulate AI verification (2 seconds)
    setTimeout(() => {
        verifyAction(file);
    }, 2000);
}

// Simulate AI Verification
function verifyAction(file) {
    const uploadArea = document.getElementById('uploadArea');
    const verificationResult = document.getElementById('verificationResult');
    const verificationText = document.getElementById('verificationText');
    const rewardAmount = document.getElementById('rewardAmount');
    
    const rewards = {
        'transport': { text: 'Took public transport (Metro)', amount: '+2.5 CARB', value: 2.5 },
        'tree': { text: 'Planted 1 tree (verified location)', amount: '+20 CARB', value: 20 },
        'solar': { text: 'Solar panel data verified', amount: '+50 CARB', value: 50 },
        'route': { text: 'Eco-route selected (saved 15kg CO₂)', amount: '+15 CARB', value: 15 }
    };
    
    const reward = rewards[currentAction];
    verificationText.textContent = `Action verified: ${reward.text}`;
    rewardAmount.textContent = reward.amount;
    
    // Calculate fiat value
    const fiatReward = (reward.value * CONFIG.TOKEN_PRICE).toFixed(2);
    document.querySelector('.reward-fiat').textContent = `≈ ₹${fiatReward}`;
    
    // Show result
    uploadArea.style.display = 'none';
    verificationResult.style.display = 'block';
}

// Claim Reward
function claimReward() {
    closeEarnModal();
    
    // Update wallet balance
    const currentBalance = parseFloat(document.getElementById('walletBalance').textContent);
    const rewards = {
        'transport': 2.5,
        'tree': 20,
        'solar': 50,
        'route': 15
    };
    const rewardValue = rewards[currentAction];
    const newBalance = currentBalance + rewardValue;
    
    updateBalance(newBalance);
    
    // Show success toast
    showToast(`Successfully earned ${rewardValue} CARB!`, 'success');
    
    // In production, call smart contract:
    // await carbTokenContract.methods.mintCarbonCredits(...).send({ from: userAccount });
}

// ===================================
// Utility Functions
// ===================================

// Scroll to section
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('earnModal');
    if (e.target.classList.contains('modal-overlay')) {
        closeEarnModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEarnModal();
    }
});

// ===================================
// Smooth Animations on Scroll
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeSlideIn 0.6s ease-out forwards';
        }
    });
}, observerOptions);

// Observe all action cards
document.querySelectorAll('.action-card-v2').forEach(card => {
    observer.observe(card);
});

// Add fadeSlideIn animation
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `
    @keyframes fadeSlideIn {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(fadeStyle);

// ===================================
// Auto-update stats (demo)
// ===================================
function updateHeroStats() {
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const current = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        if (Math.random() > 0.8) {
            const change = Math.random() > 0.5 ? 1 : -1;
            const newValue = current + change;
            stat.textContent = stat.textContent.replace(current.toString(), newValue.toString());
        }
    });
}

// Update every 5 seconds
setInterval(updateHeroStats, 5000);

// ===================================
// Initialize
// ===================================
console.log('🌱 GreenChain V2 Loaded Successfully!');
console.log('💎 Improved UI with Glassmorphism');
console.log('🔗 Web3 Integration Ready');

// Check if wallet is already connected
if (window.ethereum && window.ethereum.selectedAddress) {
    userAccount = window.ethereum.selectedAddress;
    updateWalletUI(userAccount);
    loadBalance();
}

// ===================================
// Marketplace Functions
// ===================================
function filterListings(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const cards = document.querySelectorAll('.listing-card');
    cards.forEach(card => {
        if (type === 'all' || card.dataset.type === type) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchListings(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.listing-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !q || text.includes(q) ? '' : 'none';
    });
}

let currentTrade = {};

function openTradeModal(type, amount, price, party) {
    currentTrade = { type, amount, price, party };
    const total = (amount * price).toFixed(2);

    document.getElementById('tradeModalIcon').textContent = type === 'sell' ? '🛒' : '💰';
    document.getElementById('tradeModalTitle').textContent = type === 'sell' ? 'Confirm Purchase' : 'Confirm Sale';
    document.getElementById('tradeModalSubtitle').textContent = `Review your ${type === 'sell' ? 'purchase' : 'sale'} details`;
    document.getElementById('tradeParty').textContent = party;
    document.getElementById('tradeAmount').textContent = `${amount} CARB`;
    document.getElementById('tradePrice').textContent = `₹${price.toFixed(2)}`;
    document.getElementById('tradeTotal').textContent = `₹${total}`;
    document.getElementById('tradeConfirmText').textContent = type === 'sell' ? 'Confirm Purchase' : 'Confirm Sale';

    document.getElementById('tradeModal').classList.add('show');
}

function closeTradeModal() {
    document.getElementById('tradeModal').classList.remove('show');
}

function confirmTrade() {
    const { type, amount, price, party } = currentTrade;
    const total = (amount * price).toFixed(2);

    closeTradeModal();

    if (type === 'sell') {
        const currentBalance = parseFloat(document.getElementById('walletBalance').textContent);
        updateBalance(currentBalance + amount);
        showToast(`Bought ${amount} CARB from ${party} for ₹${total}!`, 'success');
    } else {
        const currentBalance = parseFloat(document.getElementById('walletBalance').textContent);
        updateBalance(Math.max(0, currentBalance - amount));
        showToast(`Sold ${amount} CARB to ${party} for ₹${total}!`, 'success');
    }
}

function openListModal() {
    showToast('Listing feature requires wallet connection!', 'success');
    if (!userAccount) {
        document.getElementById('connectWalletBtn').click();
    }
}
