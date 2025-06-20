/**
 * README examples validation test
 * READMEに記載されているサンプルコードが実際に動作するかテストする
 */

import { Box, RBox, Maybe, Either, Task } from './src/main';

// Test interfaces
interface User {
  email: string;
  password: string;
  age: number;
}

interface UserProfile {
  id: number;
  name?: string;
  avatar?: string;
  bio?: string;
  age?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Basic usage test - Maybe
console.log('=== Basic Maybe Test ===');
const user = { name: "Alice", email: null };

const result = Maybe.pack(user.email)
  ["<$>"]((email) => email.toLowerCase())
  ["<$>"]((email) => `Email: ${email}`)
  ["<|>"]("メールアドレスが設定されていません");

console.log(result); // Should output: "メールアドレスが設定されていません"

// Box test - Data processing pipeline
console.log('\n=== Box Test ===');
interface ProcessUser {
  name: string;
  age: number;
  email: string;
}

const normalizeUser = (user: ProcessUser): ProcessUser => ({
  ...user,
  name: user.name.charAt(0).toUpperCase() + user.name.slice(1),
  email: user.email.toLowerCase()
});

const validateUserAge = (user: ProcessUser): ProcessUser | null =>
  user.age >= 18 ? user : null;

const processUser = Box.pack<ProcessUser>({ name: "alice", age: 25, email: "ALICE@EXAMPLE.COM" })
  ["<$>"](normalizeUser)
  ["<$>"](validateUserAge)
  [">>="](((user) => user ? Box.pack(user) : Box.pack(null)));

console.log(processUser.getValue()); // Should output processed user

// RBox test - Reactive shopping cart
console.log('\n=== RBox Test ===');
const cart = RBox.pack<CartItem[]>([]);

const cartTotal = cart["<$>"]((items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const cartCount = cart["<$>"]((items) => items.length);

// Subscribe to reactive changes
cart.subscribe((items) => console.log(`カートアイテム数: ${items.length}`));
cartTotal.subscribe((total) => console.log(`合計金額: ¥${total.toLocaleString()}`));

// State updates
cart.setValue((prev) => [
  ...prev,
  { id: "1", name: "ラップトップ", price: 128000, quantity: 1 }
]);

// Maybe test - Safe API data processing
console.log('\n=== Maybe Safe Processing Test ===');
// 演算子チェーンによる処理
const getUserDisplayName = (profile: UserProfile) =>
  Maybe.pack(profile.name)
    [">>="]((name: string) => Maybe.pack(profile.bio)
      [">>="]((bio: string) => {
        const cleanName = name.trim();
        const displayName = cleanName.length > 0 ? cleanName : "匿名";
        return Maybe.pack(`${displayName} - ${bio}`);
      }))
    ["<|>"]("ゲスト");

// Do記法による同じ処理
const getUserDisplayNameDo = (profile: UserProfile) =>
  Maybe.do<string, string>(function*() {
    const name = yield Maybe.pack(profile.name);
    const bio = yield Maybe.pack(profile.bio);
    const cleanName = name.trim();
    const displayName = cleanName.length > 0 ? cleanName : "匿名";
    return `${displayName} - ${bio}`;
  })["<|>"]("ゲスト");

const testProfile = { id: 1, name: "Alice", avatar: "avatar.jpg", bio: "ソフトウェア開発者" };
const displayName = getUserDisplayName(testProfile);
const displayNameDo = getUserDisplayNameDo(testProfile);

console.log('Display name (operator):', displayName);
console.log('Display name (do notation):', displayNameDo);

// Either test - Form validation
console.log('\n=== Either Validation Test ===');
const validateEmail = (email: string): Either<string, string> =>
  email.includes("@")
    ? Either.right(email)
    : Either.left("無効なメール形式");

const validatePassword = (password: string): Either<string, string> =>
  password.length >= 8
    ? Either.right(password)
    : Either.left("パスワードは8文字以上である必要があります");

const validateAge = (age: number): Either<string, number> =>
  age >= 18
    ? Either.right(age)
    : Either.left("18歳以上である必要があります");

// Chain style validation
const validateUser = (data: any): Either<string, User> =>
  validateEmail(data.email)
    [">>="](email => validatePassword(data.password)
      [">>="](password => validateAge(data.age)
        ["<$>"](age => ({ email, password, age }))));

const userData = { email: "user@example.com", password: "secretpassword", age: 25 };
const validationResult = validateUser(userData);

validationResult.match(
  (error) => console.error("バリデーション失敗:", error),
  (user) => console.log("有効なユーザー:", user)
);

// Basic operator tests
console.log('\n=== Basic Operator Tests ===');

// <$> test
const box = Box.pack(5);
const mapResult = box["<$>"]((x) => x * 2);
console.log('Map result:', mapResult.getValue()); // Should be 10

// <*> test
const boxFn = Box.pack((x: number) => x + 3);
const boxValue = Box.pack(7);
const applyResult = boxFn["<*>"](boxValue);
console.log('Apply result:', applyResult.getValue()); // Should be 10

// >>= test with Either
const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("ゼロ除算") : Either.right(a / b);

const flatMapResult = Either.right<string, number>(10)
  [">>="](((x: number) => divide(x, 2)))
  [">>="](((x: number) => divide(x, 5)));

console.log('FlatMap result:', flatMapResult["<|>"](0)); // Should be 1

// Task test
console.log('\n=== Task Test ===');
const getUserInfo = (userId: number) => {
  const fetchUser = (id: number): Task<{ id: number; name: string }> =>
    Task.from(() => Promise.resolve({ id, name: `User${id}` }));

  const fetchUserProfile = (userId: number): Task<string> =>
    Task.from(() => Promise.resolve(`Profile for user ${userId}`));

  const getProfile = (user: { id: number; name: string }) => fetchUserProfile(user.id);
  const formatProfile = (profile: string) => `Profile: ${profile}`;

  return fetchUser(userId)
    [">>="](getProfile)
    ["<$>"](formatProfile);
};

await getUserInfo(123)
  .run()
  .then(result => console.log('Task result:', result))
  .catch(error => console.error("エラー:", error));

console.log('\n=== All tests completed ===');
