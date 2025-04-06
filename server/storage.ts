import { 
  users, type User, type InsertUser,
  coins, type Coin, type InsertCoin,
  transactions, type Transaction, type InsertTransaction,
  replies, type Reply, type InsertReply,
  tokenMetadata, type TokenMetadata, type InsertTokenMetadata
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);

// Password hashing utility functions
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Storage interface with CRUD methods for our entities
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  addFriend(userId: number, friendId: number): Promise<User | undefined>;
  removeFriend(userId: number, friendId: number): Promise<User | undefined>;
  addLikedCoin(userId: number, coinId: number): Promise<User | undefined>;
  removeLikedCoin(userId: number, coinId: number): Promise<User | undefined>;
  addLikedReply(userId: number, replyId: number): Promise<User | undefined>;
  removeLikedReply(userId: number, replyId: number): Promise<User | undefined>;
  setPhoneNumber(userId: number, phoneNumber: string): Promise<User | undefined>;
  generatePhoneVerificationCode(userId: number): Promise<string>;
  verifyPhoneNumber(userId: number, code: string): Promise<boolean>;
  revokePhoneVerification(phoneNumber: string): Promise<void>;
  
  // Coin methods
  getCoin(id: number): Promise<Coin | undefined>;
  getCoinBySymbol(symbol: string): Promise<Coin | undefined>;
  getAllCoins(includeWithdrawn?: boolean): Promise<Coin[]>;
  getTrendingCoins(limit?: number): Promise<Coin[]>;
  getCoinsByTag(tag: string): Promise<Coin[]>;
  createCoin(coin: InsertCoin): Promise<Coin>;
  updateCoin(id: number, updates: Partial<Coin>): Promise<Coin | undefined>;
  searchCoins(query: string): Promise<Coin[]>;
  getLatestCreatedCoin(): Promise<Coin | undefined>;
  getLatestWithdrawnCoin(): Promise<Coin | undefined>;
  withdrawCoin(id: number): Promise<Coin | undefined>;
  
  // Transaction methods
  getTransactions(coinId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Reply methods
  getReplies(coinId: number): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;
  
  // Token Metadata methods
  getTokenMetadata(tokenId: string): Promise<TokenMetadata | undefined>;
  createTokenMetadata(metadata: InsertTokenMetadata): Promise<TokenMetadata>;
  updateTokenMetadata(tokenId: string, updates: Partial<TokenMetadata>): Promise<TokenMetadata | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private coins: Map<number, Coin>;
  private transactions: Map<number, Transaction>;
  private replies: Map<number, Reply>;
  private tokenMetadatas: Map<string, TokenMetadata>;
  
  private userId: number;
  private coinId: number;
  private transactionId: number;
  private replyId: number;
  private tokenMetadataId: number;

  // Session store for auth
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.coins = new Map();
    this.transactions = new Map();
    this.replies = new Map();
    this.tokenMetadatas = new Map();
    
    this.userId = 1;
    this.coinId = 1;
    this.transactionId = 1;
    this.replyId = 1;
    this.tokenMetadataId = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize sample data synchronously to avoid async constructor issues
    this.initBasicSampleData();
  }
  
  private initBasicSampleData() {
    // Create basic sample data for testing
    // We'll use hardcoded values for the test users to avoid async password hashing
    
    const daveUser: User = {
      id: this.userId++,
      username: "dave",
      email: "dave@metalfun.com",
      password: "6a2462fc47fe3a51ec145ad89a3ad0c2eda2f52dc05cd715437506abf73a2859ee6ff1a9bc43f5b5f187c3c87fbb6fa18e9ae7c881a4a2886dd1acbc235f0124.a2906b45ea21414593d9b77a06110031", // "admin6"
      displayName: "Dave Metaller",
      bio: "Metal enthusiast and token creator",
      avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      metalAddress: "0x5a1ed1596b85f6ec0488fe260df88c94958c6d56", // Fixed address for testing
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      holdingIds: [],
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };
    
    const anaUser: User = {
      id: this.userId++,
      username: "ana",
      email: "ana@metalfun.com",
      password: "6a2462fc47fe3a51ec145ad89a3ad0c2eda2f52dc05cd715437506abf73a2859ee6ff1a9bc43f5b5f187c3c87fbb6fa18e9ae7c881a4a2886dd1acbc235f0124.a2906b45ea21414593d9b77a06110031", // "admin6"
      displayName: "Ana Metal",
      bio: "Cryptocurrency enthusiast and trader",
      avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      metalAddress: "0x7b2c8f33b0d5d89c8e347b8c8dbee80d7c6a9559", // Fixed address for testing
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      holdingIds: [],
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };
    
    const testUser: User = {
      id: this.userId++,
      username: "test",
      email: "test@test.com",
      password: "6a2462fc47fe3a51ec145ad89a3ad0c2eda2f52dc05cd715437506abf73a2859ee6ff1a9bc43f5b5f187c3c87fbb6fa18e9ae7c881a4a2886dd1acbc235f0124.a2906b45ea21414593d9b77a06110031", // "adminadmin"
      displayName: "Testname",
      bio: "void",
      avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      createdAt: new Date(),
      metalAddress: "0x8c9d8f33b0d5d89c8e347b8c8dbee80d7c6a1234", // Fixed address for testing
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      holdingIds: [],
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };

    // Add users to storage
    this.users.set(daveUser.id, daveUser);
    this.users.set(anaUser.id, anaUser);
    this.users.set(testUser.id, testUser);
    
    // Add some basic sample coins and link them to our test users
    this.initCoinsAndTransactions(daveUser, anaUser);
  }
  
  // Initialize coins and transactions for our test users
  private initCoinsAndTransactions(daveUser: User, anaUser: User) {
    const now = new Date();
    
    // Create Dave's coins
    const davesCoin: Coin = {
      id: this.coinId++,
      name: "Dave's Steel",
      symbol: "DAVE",
      description: "A high-performance steel token created by Dave",
      image: "https://cdn.pixabay.com/photo/2017/02/01/09/55/steele-2029630_1280.jpg",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      createdBy: daveUser.id.toString(),
      marketCap: 750000,
      replyCount: 42,
      isMigrated: true,
      isTrending: true,
      holderCount: 120,
      previousHolderCount: 85,
      lastUpdated: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      isWithdrawn: false,
      withdrawnAt: null,
      price: "0.0015",
      priceChange24h: "8.5",
      volume24h: "12500",
      tags: ["metal", "steel", "dave"]
    };
    
    // Create Ana's coins
    const anasCoin: Coin = {
      id: this.coinId++,
      name: "Ana's Gold",
      symbol: "ANAG",
      description: "A premium gold token created by Ana",
      image: "https://cdn.pixabay.com/photo/2019/06/03/12/07/gold-4249013_1280.jpg",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdBy: anaUser.id.toString(),
      marketCap: 950000,
      replyCount: 56,
      isMigrated: true,
      isTrending: true,
      holderCount: 150,
      previousHolderCount: 95,
      lastUpdated: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      isWithdrawn: false,
      withdrawnAt: null,
      price: "0.0025",
      priceChange24h: "12.2",
      volume24h: "18500",
      tags: ["metal", "gold", "ana"]
    };
    
    // Add coins to storage
    this.coins.set(davesCoin.id, davesCoin);
    this.coins.set(anasCoin.id, anasCoin);
    
    // Update user's coinIds (tokens created)
    daveUser.coinIds = [davesCoin.id.toString()];
    anaUser.coinIds = [anasCoin.id.toString()];
    
    // Update user's holdingIds (tokens owned)
    daveUser.holdingIds = [davesCoin.id.toString(), anasCoin.id.toString()];  
    anaUser.holdingIds = [anasCoin.id.toString(), davesCoin.id.toString()];
    
    // Create some transactions between Dave and Ana
    const transaction1: Transaction = {
      id: this.transactionId++,
      userId: daveUser.id.toString(),
      coinId: anasCoin.id,
      amount: "25",
      type: "buy",
      solAmount: "0.0625", // 25 * 0.0025
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    };
    
    const transaction2: Transaction = {
      id: this.transactionId++,
      userId: anaUser.id.toString(),
      coinId: davesCoin.id,
      amount: "40",
      type: "buy",
      solAmount: "0.06", // 40 * 0.0015
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    };
    
    const transaction3: Transaction = {
      id: this.transactionId++,
      userId: daveUser.id.toString(),
      coinId: anasCoin.id,
      amount: "10",
      type: "sell",
      solAmount: "0.025", // 10 * 0.0025
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    };
    
    // Add transactions to storage
    this.transactions.set(transaction1.id, transaction1);
    this.transactions.set(transaction2.id, transaction2);
    this.transactions.set(transaction3.id, transaction3);
    
    // Add some replies to the coins
    const reply1: Reply = {
      id: this.replyId++,
      coinId: davesCoin.id,
      userId: anaUser.id.toString(),
      username: anaUser.username,
      userAvatar: anaUser.avatar,
      content: "Great token, Dave! I really like the fundamentals.",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      likeCount: 5,
      parentId: null,
      isAnonymous: false
    };
    
    const reply2: Reply = {
      id: this.replyId++,
      coinId: anasCoin.id,
      userId: daveUser.id.toString(),
      username: daveUser.username,
      userAvatar: daveUser.avatar,
      content: "Excellent gold token, Ana! The tokenomics look solid.",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      likeCount: 8,
      parentId: null,
      isAnonymous: false
    };
    
    const reply3: Reply = {
      id: this.replyId++,
      coinId: davesCoin.id,
      userId: "anonymous",
      username: "Anonymous",
      userAvatar: null,
      content: "This is an anonymous comment on Dave's token. Looking promising!",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      likeCount: 3,
      parentId: null,
      isAnonymous: true
    };
    
    // Add replies to storage
    this.replies.set(reply1.id, reply1);
    this.replies.set(reply2.id, reply2);
    this.replies.set(reply3.id, reply3);
    
    // Update users in storage
    this.users.set(daveUser.id, daveUser);
    this.users.set(anaUser.id, anaUser);
  }

  // Initialize sample data for demo purposes
  private async initSampleData() {
    // Current date and timestamps for realistic data
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Create test users (Dave and Ana)
    const davePassword = await hashPassword("admin6");
    const anaPassword = await hashPassword("admin6");
    
    const daveUser: User = {
      id: this.userId++,
      username: "dave",
      email: "dave@metalfun.com",
      password: davePassword,
      displayName: "Dave Metaller",
      bio: "Metal enthusiast and token creator",
      avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      metalAddress: "0x" + randomBytes(20).toString("hex"),
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      holdingIds: [],
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };
    
    const anaUser: User = {
      id: this.userId++,
      username: "ana",
      email: "ana@metalfun.com",
      password: anaPassword,
      displayName: "Ana Metal",
      bio: "Cryptocurrency enthusiast and trader",
      avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      metalAddress: "0x" + randomBytes(20).toString("hex"),
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      holdingIds: [],
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };
    
    // Add users to storage
    this.users.set(daveUser.id, daveUser);
    this.users.set(anaUser.id, anaUser);
    
    // Sample metal-themed coins with realistic data
    const sampleCoins = [
      {
        name: "STEELIX",
        symbol: "STEEL",
        description: "Metal Development Team Announced Completion of the Steel Fusion Processing",
        image: "https://cdn.pixabay.com/photo/2017/02/01/09/55/steele-2029630_1280.jpg",
        createdBy: daveUser.id.toString(), // Assign to Dave
        isMigrated: false,
        isTrending: true,
        tags: ["metal", "steel", "fusion"],
        marketCap: 510500,
        replyCount: 1872,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        holderCount: 850,
        previousHolderCount: 720
      },
      {
        name: "Silver Coin",
        symbol: "SILV",
        description: "Elon Musk Backs Silver as Essential Component for EV Production",
        image: "https://cdn.pixabay.com/photo/2016/08/23/01/20/silver-1613435_1280.jpg",
        createdBy: anaUser.id.toString(), // Assign to Ana
        isMigrated: true,
        isTrending: true,
        tags: ["silver", "metal", "elon"],
        marketCap: 33700000,
        replyCount: 2585,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        holderCount: 2150,
        previousHolderCount: 1850
      },
      {
        name: "BitGold",
        symbol: "BGOLD",
        description: "BitGold Shines Bright as the Market Dips",
        image: "https://cdn.pixabay.com/photo/2019/06/03/12/07/gold-4249013_1280.jpg",
        createdBy: daveUser.id.toString(), // Assign to Dave
        isMigrated: true,
        isTrending: true,
        tags: ["gold", "bitcoin", "metal"],
        marketCap: 11800000,
        replyCount: 618,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        holderCount: 1450,
        previousHolderCount: 1100
      },
      {
        name: "IronClad",
        symbol: "IRON",
        description: "Investors Discover Link Between Industrial Metal Markets and Cryptocurrency",
        image: "https://cdn.pixabay.com/photo/2018/11/30/14/13/iron-3847983_1280.jpg",
        createdBy: "Z9F3PQ",
        isMigrated: false,
        isTrending: true,
        tags: ["iron", "metal", "industrial"],
        marketCap: 1400000,
        replyCount: 628,
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        holderCount: 585,
        previousHolderCount: 320
      },
      {
        name: "Copper Connect",
        symbol: "COPR",
        description: "Copper Network Infrastructure Becoming Crucial for Web3 Development",
        image: "https://cdn.pixabay.com/photo/2015/09/17/14/24/copper-944293_1280.jpg",
        createdBy: "K3R7MA",
        isMigrated: false,
        isTrending: false,
        tags: ["copper", "metal", "network"],
        marketCap: 750000,
        replyCount: 322,
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        holderCount: 310,
        previousHolderCount: 290
      },
      {
        name: "Platinum Protocol",
        symbol: "PLAT",
        description: "Luxury Metal Token Gaining Traction Among High-Net-Worth Investors",
        image: "https://cdn.pixabay.com/photo/2016/08/12/22/33/platinum-1589717_1280.jpg",
        createdBy: "P5T9QR",
        isMigrated: false,
        isTrending: false,
        tags: ["platinum", "metal", "luxury"],
        marketCap: 2800000,
        replyCount: 465,
        createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        holderCount: 750,
        previousHolderCount: 705
      },
      // Additional coins to reach 20 total
      {
        name: "Titanium Tech",
        symbol: "TITAN",
        description: "Lightweight and Strong: Titanium Tech Leads Innovation in Aerospace Blockchain Solutions",
        image: "https://cdn.pixabay.com/photo/2015/03/26/15/42/industry-692630_1280.jpg",
        createdBy: "T1T4N5",
        isMigrated: true,
        isTrending: true,
        tags: ["titanium", "aerospace", "metal"],
        marketCap: 8900000,
        replyCount: 1205,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        holderCount: 1890,
        previousHolderCount: 1470
      },
      {
        name: "ChromeX",
        symbol: "CRMX",
        description: "ChromeX Launches Revolutionary Browser Extension for Crypto Payments",
        image: "https://cdn.pixabay.com/photo/2014/07/01/12/35/taxi-381233_1280.jpg",
        createdBy: "C9X8R7",
        isMigrated: true,
        isTrending: true,
        tags: ["chrome", "browser", "payments"],
        marketCap: 3400000,
        replyCount: 876,
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        holderCount: 965,
        previousHolderCount: 687
      },
      {
        name: "Lead Lightning",
        symbol: "LEAD",
        description: "Heavy Metal Token with Lightning Fast Transactions on Layer 2 Solutions",
        image: "https://cdn.pixabay.com/photo/2020/11/24/15/23/lightning-5772800_1280.jpg",
        createdBy: "L3D7N9",
        isMigrated: false,
        isTrending: false,
        tags: ["lead", "layer2", "metal"],
        marketCap: 520000,
        replyCount: 211,
        createdAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
        holderCount: 288,
        previousHolderCount: 255
      },
      {
        name: "Mercury Mobile",
        symbol: "MERC",
        description: "Fluid Payments Platform Utilizing Mercury Technology for Instant Settlements",
        image: "https://cdn.pixabay.com/photo/2017/03/08/20/11/mercury-2127642_1280.jpg",
        createdBy: "M9R8C7",
        isMigrated: false,
        isTrending: true,
        tags: ["mercury", "mobile", "payments"],
        marketCap: 4100000,
        replyCount: 532,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        holderCount: 1280,
        previousHolderCount: 920
      },
      {
        name: "Aluminum Alliance",
        symbol: "ALUM",
        description: "Lightweight Blockchain Solution for Supply Chain Verification of Aluminum Products",
        image: "https://cdn.pixabay.com/photo/2016/09/12/12/51/soft-drink-can-1664028_1280.jpg",
        createdBy: "A7L9M3",
        isMigrated: true,
        isTrending: false,
        tags: ["aluminum", "supply-chain", "metal"],
        marketCap: 1850000,
        replyCount: 345,
        createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        holderCount: 411,
        previousHolderCount: 387
      },
      {
        name: "Tungsten Token",
        symbol: "TUNG",
        description: "Hardest Cryptocurrency in Existence with Unbreakable Smart Contracts",
        image: "https://cdn.pixabay.com/photo/2019/08/22/14/07/welding-4423954_1280.jpg",
        createdBy: "T5N9S7",
        isMigrated: true,
        isTrending: true,
        tags: ["tungsten", "security", "metal"],
        marketCap: 7600000,
        replyCount: 1089,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        holderCount: 1650,
        previousHolderCount: 1220
      },
      {
        name: "Zinc Network",
        symbol: "ZINC",
        description: "Anti-Corrosion Blockchain Platform for Long-Term Asset Storage",
        image: "https://cdn.pixabay.com/photo/2017/06/12/14/53/basin-2395169_1280.jpg",
        createdBy: "Z7N9C5",
        isMigrated: false,
        isTrending: false,
        tags: ["zinc", "storage", "metal"],
        marketCap: 980000,
        replyCount: 254,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        holderCount: 378,
        previousHolderCount: 365
      },
      {
        name: "Palladium Pay",
        symbol: "PLDM",
        description: "Luxury Payment System Using Rare Metal Tokenization for Elite Transactions",
        image: "https://cdn.pixabay.com/photo/2018/01/15/11/34/woman-3083399_1280.jpg",
        createdBy: "P9L7D1",
        isMigrated: true,
        isTrending: true,
        tags: ["palladium", "luxury", "payments"],
        marketCap: 22500000,
        replyCount: 1865,
        createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        holderCount: 3470,
        previousHolderCount: 2850
      },
      {
        name: "Brass Bazaar",
        symbol: "BRSS",
        description: "Decentralized Marketplace Using Brass Tokens for Artisan Products",
        image: "https://cdn.pixabay.com/photo/2021/08/30/21/29/port-6587129_1280.jpg",
        createdBy: "B7R9S3",
        isMigrated: false,
        isTrending: false,
        tags: ["brass", "marketplace", "artisan"],
        marketCap: 740000,
        replyCount: 427,
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        holderCount: 295,
        previousHolderCount: 282
      },
      {
        name: "Cobalt Chain",
        symbol: "CBLT",
        description: "Revolutionary Token Powering Electric Vehicle Battery Traceability",
        image: "https://cdn.pixabay.com/photo/2021/01/18/13/51/battery-5928038_1280.jpg",
        createdBy: "C7B5T3",
        isMigrated: true,
        isTrending: true,
        tags: ["cobalt", "batteries", "electric"],
        marketCap: 13700000,
        replyCount: 1532,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        holderCount: 2275,
        previousHolderCount: 1850
      },
      {
        name: "Lithium Light",
        symbol: "LITH",
        description: "Lightweight Token for Energy Storage and Battery Solutions",
        image: "https://cdn.pixabay.com/photo/2015/06/03/13/59/light-bulb-796381_1280.jpg",
        createdBy: "L8T9H2",
        isMigrated: true,
        isTrending: false,
        tags: ["lithium", "energy", "batteries"],
        marketCap: 9200000,
        replyCount: 842,
        createdAt: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
        holderCount: 1240,
        previousHolderCount: 1180
      },
      {
        name: "Magnesium Money",
        symbol: "MGSM",
        description: "Lightweight Financial Solution that Burns Bright in the DeFi Space",
        image: "https://cdn.pixabay.com/photo/2019/09/05/13/55/fire-4454223_1280.jpg",
        createdBy: "M9G7S1",
        isMigrated: false,
        isTrending: true,
        tags: ["magnesium", "defi", "metal"],
        marketCap: 3850000,
        replyCount: 621,
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        holderCount: 765,
        previousHolderCount: 520
      },
      {
        name: "Uranium Utility",
        symbol: "URNU",
        description: "High-Energy Token Powering the Next Generation of Decentralized Applications",
        image: "https://cdn.pixabay.com/photo/2013/07/13/10/22/atom-157036_1280.png",
        createdBy: "U9R7N5",
        isMigrated: true,
        isTrending: true,
        tags: ["uranium", "energy", "nuclear"],
        marketCap: 28600000,
        replyCount: 1973,
        createdAt: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
        holderCount: 3750,
        previousHolderCount: 3250
      },
      {
        name: "Vanadium Vault",
        symbol: "VAND",
        description: "Ultra-Secure Storage Solution Using Vanadium Encryption Technology",
        image: "https://cdn.pixabay.com/photo/2021/02/20/21/26/vault-6034513_1280.jpg",
        createdBy: "V9N7D5",
        isMigrated: false,
        isTrending: false,
        tags: ["vanadium", "storage", "security"],
        marketCap: 5300000,
        replyCount: 476,
        createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
        holderCount: 625,
        previousHolderCount: 590
      }
    ];

    // Add the coins to our store
    sampleCoins.forEach(coin => {
      const id = this.coinId++;
      
      // Create a fully typed coin with all required fields
      const fullCoin: Coin = {
        id,
        name: coin.name,
        symbol: coin.symbol,
        description: coin.description,
        image: coin.image,
        createdAt: coin.createdAt || new Date(),
        createdBy: coin.createdBy,
        marketCap: coin.marketCap,
        replyCount: coin.replyCount,
        isMigrated: coin.isMigrated,
        isTrending: coin.isTrending,
        holderCount: coin.holderCount || Math.floor(Math.random() * 1000),
        previousHolderCount: coin.previousHolderCount || Math.floor(Math.random() * 800),
        lastUpdated: new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
        isWithdrawn: false,
        withdrawnAt: null,
        price: (0.001 + Math.random() * 0.05).toFixed(6),
        priceChange24h: (Math.random() * 30 - 15).toFixed(2),
        volume24h: (Math.random() * 100000).toFixed(2),
        tags: coin.tags
      };
      
      this.coins.set(id, fullCoin);
    });
    
    // Add withdrawn coins for testing
    const withdrawnCoins = [
      {
        name: "Nickel Network",
        symbol: "NCKL",
        description: "Nickel Network Token Was Withdrawn Due to Low Trading Volume",
        image: "https://cdn.pixabay.com/photo/2020/01/31/07/26/metal-4807096_1280.jpg",
        createdBy: "R2D2C3",
        marketCap: 250000,
        replyCount: 112,
        tags: ["nickel", "metal", "network"],
        createdAt: oneWeekAgo,
        withdrawnAt: oneDayAgo
      },
      {
        name: "Bismuth Blockchain",
        symbol: "BSMT",
        description: "Bismuth Blockchain Project Withdrawn After Security Audit Concerns",
        image: "https://cdn.pixabay.com/photo/2018/07/28/11/08/stones-3567767_1280.jpg",
        createdBy: "B7M2T9",
        marketCap: 180000,
        replyCount: 87,
        tags: ["bismuth", "security", "metal"],
        createdAt: twoWeeksAgo,
        withdrawnAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        name: "Mercury Mobile X",
        symbol: "MERX",
        description: "Mobile Payment Solution Withdrawn After Regulatory Challenges",
        image: "https://cdn.pixabay.com/photo/2020/04/14/04/16/space-5041862_1280.jpg",
        createdBy: "M5X7R9",
        marketCap: 320000,
        replyCount: 142,
        tags: ["mercury", "mobile", "payments"],
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        withdrawnAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    // Add the withdrawn coins
    withdrawnCoins.forEach(coin => {
      const id = this.coinId++;
      
      const withdrawnCoin: Coin = {
        id,
        name: coin.name,
        symbol: coin.symbol,
        description: coin.description,
        image: coin.image,
        createdAt: coin.createdAt,
        createdBy: coin.createdBy,
        marketCap: coin.marketCap,
        replyCount: coin.replyCount,
        isMigrated: false,
        isTrending: false,
        holderCount: Math.floor(Math.random() * 300 + 50),
        previousHolderCount: Math.floor(Math.random() * 400 + 100),
        lastUpdated: coin.withdrawnAt,
        isWithdrawn: true,
        withdrawnAt: coin.withdrawnAt,
        price: (0.0001 + Math.random() * 0.001).toFixed(6),
        priceChange24h: (-30 - Math.random() * 50).toFixed(2), // Negative price change
        volume24h: (Math.random() * 10000).toFixed(2),
        tags: coin.tags
      };
      
      this.coins.set(id, withdrawnCoin);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    
    // Set up default user attributes
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      holdingIds: [],
      friendIds: [],
      likedCoinIds: [],
      likedReplyIds: [],
      coinIds: [],
      metalAddress: `metal_${id}_${Math.random().toString(36).substring(2, 10)}`,
      displayName: insertUser.displayName || null,
      bio: insertUser.bio || null,
      avatar: insertUser.avatar || null,
      phoneNumber: null,
      phoneVerified: false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.phoneNumber === phoneNumber && user.phoneVerified
    );
  }
  
  async setPhoneNumber(userId: number, phoneNumber: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Check if phone is already verified by another user
    const existingUser = await this.getUserByPhoneNumber(phoneNumber);
    if (existingUser && existingUser.id !== userId) {
      // Revoke verification from the other user
      await this.revokePhoneVerification(phoneNumber);
    }
    
    // Update user's phone number and reset verification status
    user.phoneNumber = phoneNumber;
    user.phoneVerified = false;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpiry = null;
    
    this.users.set(userId, user);
    return user;
  }
  
  async generatePhoneVerificationCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user || !user.phoneNumber) throw new Error('User not found or phone number not set');
    
    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set verification code and expiry (30 minutes from now)
    user.phoneVerificationCode = code;
    user.phoneVerificationExpiry = new Date(Date.now() + 30 * 60 * 1000);
    
    this.users.set(userId, user);
    return code;
  }
  
  async verifyPhoneNumber(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.phoneNumber || !user.phoneVerificationCode) {
      return false;
    }
    
    // Check if code is expired
    if (!user.phoneVerificationExpiry || new Date() > user.phoneVerificationExpiry) {
      return false;
    }
    
    // Check if code matches
    if (user.phoneVerificationCode !== code) {
      return false;
    }
    
    // Verification successful
    user.phoneVerified = true;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpiry = null;
    
    this.users.set(userId, user);
    return true;
  }
  
  async revokePhoneVerification(phoneNumber: string): Promise<void> {
    const user = Array.from(this.users.values()).find(user => 
      user.phoneNumber === phoneNumber && user.phoneVerified
    );
    
    if (user) {
      user.phoneVerified = false;
      this.users.set(user.id, user);
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addFriend(userId: number, friendId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Only add if not already in the list
    if (!user.friendIds.includes(friendId.toString())) {
      const updatedFriendIds = [...user.friendIds, friendId.toString()];
      return this.updateUser(userId, { friendIds: updatedFriendIds });
    }
    
    return user;
  }

  async removeFriend(userId: number, friendId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedFriendIds = user.friendIds.filter(id => id !== friendId.toString());
    return this.updateUser(userId, { friendIds: updatedFriendIds });
  }

  async addLikedCoin(userId: number, coinId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Only add if not already in the list
    if (!user.likedCoinIds.includes(coinId.toString())) {
      const updatedLikedCoinIds = [...user.likedCoinIds, coinId.toString()];
      return this.updateUser(userId, { likedCoinIds: updatedLikedCoinIds });
    }
    
    return user;
  }

  async removeLikedCoin(userId: number, coinId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedLikedCoinIds = user.likedCoinIds.filter(id => id !== coinId.toString());
    return this.updateUser(userId, { likedCoinIds: updatedLikedCoinIds });
  }

  async addLikedReply(userId: number, replyId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Only add if not already in the list
    if (!user.likedReplyIds.includes(replyId.toString())) {
      const updatedLikedReplyIds = [...user.likedReplyIds, replyId.toString()];
      return this.updateUser(userId, { likedReplyIds: updatedLikedReplyIds });
    }
    
    return user;
  }

  async removeLikedReply(userId: number, replyId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedLikedReplyIds = user.likedReplyIds.filter(id => id !== replyId.toString());
    return this.updateUser(userId, { likedReplyIds: updatedLikedReplyIds });
  }

  // Coin methods
  async getCoin(id: number): Promise<Coin | undefined> {
    return this.coins.get(id);
  }

  async getCoinBySymbol(symbol: string): Promise<Coin | undefined> {
    return Array.from(this.coins.values()).find(
      (coin) => coin.symbol === symbol,
    );
  }

  async getAllCoins(includeWithdrawn: boolean = false): Promise<Coin[]> {
    const allCoins = Array.from(this.coins.values());
    if (includeWithdrawn) {
      return allCoins;
    }
    return allCoins.filter(coin => !coin.isWithdrawn);
  }

  async getTrendingCoins(limit: number = 9): Promise<Coin[]> {
    return Array.from(this.coins.values())
      .filter(coin => !coin.isWithdrawn)
      .sort((a, b) => {
        const aHolderGrowth = a.holderCount - a.previousHolderCount;
        const bHolderGrowth = b.holderCount - b.previousHolderCount;
        return bHolderGrowth - aHolderGrowth;
      })
      .slice(0, limit);
  }

  async getCoinsByTag(tag: string): Promise<Coin[]> {
    return Array.from(this.coins.values())
      .filter(coin => !coin.isWithdrawn && coin.tags.includes(tag))
      .sort((a, b) => b.marketCap - a.marketCap);
  }

  async createCoin(insertCoin: InsertCoin): Promise<Coin> {
    const id = this.coinId++;
    const createdAt = new Date();
    
    // Create a fully typed coin with all required fields and ensure required booleans have default values
    const coin: Coin = { 
      id,
      name: insertCoin.name,
      symbol: insertCoin.symbol,
      description: insertCoin.description,
      image: insertCoin.image,
      createdAt,
      createdBy: insertCoin.createdBy,
      marketCap: 0,
      replyCount: 0,
      isMigrated: insertCoin.isMigrated !== undefined ? insertCoin.isMigrated : false,
      isTrending: insertCoin.isTrending !== undefined ? insertCoin.isTrending : false,
      holderCount: 0,
      previousHolderCount: 0,
      lastUpdated: createdAt,
      isWithdrawn: false,
      withdrawnAt: null,
      price: "0.001",
      priceChange24h: "0",
      volume24h: "0",
      tags: insertCoin.tags
    };
    
    this.coins.set(id, coin);
    return coin;
  }

  async updateCoin(id: number, updates: Partial<Coin>): Promise<Coin | undefined> {
    const existingCoin = this.coins.get(id);
    if (!existingCoin) return undefined;
    
    const updatedCoin = { ...existingCoin, ...updates };
    this.coins.set(id, updatedCoin);
    return updatedCoin;
  }

  async searchCoins(query: string): Promise<Coin[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.coins.values())
      .filter(coin => 
        !coin.isWithdrawn && (
          coin.name.toLowerCase().includes(lowercaseQuery) || 
          coin.symbol.toLowerCase().includes(lowercaseQuery) ||
          coin.description.toLowerCase().includes(lowercaseQuery)
        )
      );
  }

  async getLatestCreatedCoin(): Promise<Coin | undefined> {
    return Array.from(this.coins.values())
      .filter(coin => !coin.isWithdrawn)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];
  }

  async getLatestWithdrawnCoin(): Promise<Coin | undefined> {
    return Array.from(this.coins.values())
      .filter(coin => coin.isWithdrawn && coin.withdrawnAt !== null)
      .sort((a, b) => {
        return new Date(b.withdrawnAt!).getTime() - new Date(a.withdrawnAt!).getTime();
      })[0];
  }

  async withdrawCoin(id: number): Promise<Coin | undefined> {
    const existingCoin = this.coins.get(id);
    if (!existingCoin) return undefined;
    
    const now = new Date();
    const updatedCoin = { 
      ...existingCoin, 
      isWithdrawn: true,
      withdrawnAt: now
    };
    
    this.coins.set(id, updatedCoin);
    return updatedCoin;
  }

  // Transaction methods
  async getTransactions(coinId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.coinId === coinId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const createdAt = new Date();
    const transaction: Transaction = { ...insertTransaction, id, createdAt };
    this.transactions.set(id, transaction);
    
    // Update coin's stats based on transaction
    const coin = await this.getCoin(insertTransaction.coinId);
    if (coin) {
      const newMarketCap = coin.marketCap + parseInt(insertTransaction.solAmount);
      
      // Update holder count for buy transactions
      let newHolderCount = coin.holderCount;
      if (transaction.type === 'buy') {
        newHolderCount += 1;
      } else if (transaction.type === 'sell' && newHolderCount > 0) {
        newHolderCount -= 1;
      }
      
      // Update volume - ensure we handle possible null values
      const currentVolume = parseFloat(coin.volume24h || "0");
      const transactionAmount = parseFloat(insertTransaction.solAmount);
      const newVolume = (currentVolume + transactionAmount).toFixed(2);
      
      // Update price - ensure we handle possible null values
      const currentPrice = parseFloat(coin.price || "0.001");
      const priceChange = (Math.random() * 0.001 * (transaction.type === 'buy' ? 1 : -1)).toFixed(6);
      const newPrice = (currentPrice + parseFloat(priceChange)).toFixed(6);
      
      // Update price change percentage
      const priceChangePercent = ((parseFloat(newPrice) - currentPrice) / currentPrice * 100).toFixed(2);
      
      await this.updateCoin(coin.id, { 
        marketCap: newMarketCap,
        holderCount: newHolderCount,
        lastUpdated: createdAt,
        price: newPrice,
        priceChange24h: priceChangePercent,
        volume24h: newVolume
      });
    }
    
    return transaction;
  }

  // Reply methods
  async getReplies(coinId: number): Promise<Reply[]> {
    return Array.from(this.replies.values())
      .filter(reply => reply.coinId === coinId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createReply(insertReply: InsertReply): Promise<Reply> {
    const id = this.replyId++;
    const createdAt = new Date();
    
    // Add required fields that might not be in the insert schema
    const reply: Reply = { 
      ...insertReply, 
      id, 
      createdAt,
      likeCount: 0,
      username: insertReply.username || null,
      userAvatar: insertReply.userAvatar || null,
      parentId: insertReply.parentId || null,
      isAnonymous: insertReply.isAnonymous === true
    };
    
    this.replies.set(id, reply);
    
    // Update coin's reply count
    const coin = await this.getCoin(insertReply.coinId);
    if (coin) {
      await this.updateCoin(coin.id, { replyCount: coin.replyCount + 1 });
    }
    
    return reply;
  }
  
  // Token Metadata methods
  async getTokenMetadata(tokenId: string): Promise<TokenMetadata | undefined> {
    return this.tokenMetadatas.get(tokenId);
  }

  async createTokenMetadata(insertMetadata: InsertTokenMetadata): Promise<TokenMetadata> {
    const id = this.tokenMetadataId++;
    const createdAt = new Date();
    
    // Ensure all nullable fields are explicitly set to null if undefined
    const metadata: TokenMetadata = { 
      id,
      tokenId: insertMetadata.tokenId, 
      createdAt,
      description: insertMetadata.description !== undefined ? insertMetadata.description : null,
      image: insertMetadata.image !== undefined ? insertMetadata.image : null,
      tags: insertMetadata.tags !== undefined ? insertMetadata.tags : null,
      metalAddress: insertMetadata.metalAddress !== undefined ? insertMetadata.metalAddress : null,
      merchantAddress: insertMetadata.merchantAddress !== undefined ? insertMetadata.merchantAddress : null,
      additionalData: insertMetadata.additionalData || null
    };
    
    this.tokenMetadatas.set(insertMetadata.tokenId, metadata);
    return metadata;
  }

  async updateTokenMetadata(tokenId: string, updates: Partial<TokenMetadata>): Promise<TokenMetadata | undefined> {
    const existingMetadata = this.tokenMetadatas.get(tokenId);
    if (!existingMetadata) return undefined;
    
    const updatedMetadata = { ...existingMetadata, ...updates };
    this.tokenMetadatas.set(tokenId, updatedMetadata);
    return updatedMetadata;
  }
}

export const storage = new MemStorage();
