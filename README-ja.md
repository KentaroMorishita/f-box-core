# F-Box Core

[![npm version](https://badge.fury.io/js/f-box-core.svg)](https://badge.fury.io/js/f-box-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**F-Box Core**は、TypeScriptで関数合成を行うためのライブラリです。`Box`、`RBox`、`Maybe`、`Either`、`Task`の5つの型を提供し、小さな関数を組み合わせて複雑な処理を構築できます。

## 特徴

- **関数合成**: 小さな関数を組み合わせて複雑な処理を構築
- **演算子チェーン**: `<$>`、`<*>`、`>>=`による値の変換・合成・チェーン
- **型安全性**: null参照例外とランタイムエラーの排除
- **軽量**: 依存関係ゼロの小さなライブラリ
- **一貫したAPI**: 各型で統一された操作方法

## インストール

```bash
npm install f-box-core
```

## なぜF-Box？

| タイプ     | 用途 | 説明                                                                                    |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `Box`    | **関数合成** | 関数型変換を持つ値のシンプルなコンテナ |
| `RBox`   | **状態管理** | サブスクリプションベースの更新を持つリアクティブコンテナ |
| `Maybe`  | **Null安全性** | null/undefined エラーを排除するオプショナル値 |
| `Either` | **エラーハンドリング** | 成功（`Right`）または失敗（`Left`）する計算 |
| `Task`   | **非同期操作** | 合成可能な非同期計算 |

## 基本的な使い方

F-Boxの各型は、関数を組み合わせて処理を構築するためのメソッドと演算子を提供します：

```typescript
import { Maybe } from "f-box-core";

// nullになる可能性のある値を安全に処理
const user = { name: "Alice", email: null };

const result = Maybe.pack(user.email)
  ["<$>"]((email) => email.toLowerCase())  // emailがnullでなければ小文字に変換
  ["<$>"]((email) => `Email: ${email}`)    // メッセージを追加
  ["<|>"]("メールアドレスが設定されていません"); // 値を取得またはデフォルト値 (getOrElseのエイリアス)

console.log(result); // "メールアドレスが設定されていません"
```

### 実例: エラーハンドリング付きユーザー登録

```typescript
const registerUser = (userInput: any) =>
  validateEmail(userInput.email)
    [">>="]((email) => validatePassword(userInput.password)
      ["<$>"]((password) => ({ email, password })))
    [">>="]((credentials) => createUser(credentials))
    [">>="]((user) => generateToken(user.id)
      ["<$>"]((token) => ({ user, token })));

// いずれかのステップが失敗すると、計算全体がショートサーキット
registerUser(userData).match(
  (error) => console.error("登録失敗:", error),
  (result) => console.log("ユーザー登録:", result)
);
```

## 基本演算子

F-Boxは関数合成のために3つの主要な演算子を使用します：

| 演算子 | 名前           | 説明                                                                                                                       |
| -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<$>`    | Map            | コンテナ内の値を変換します。                                  |
| `<*>`    | Apply          | ラップされた関数をラップされた値に適用します。                               |
| `>>=`    | FlatMap (Bind) | 結果をフラット化しながら計算をチェーンします。 |

### 演算子使用例

#### `<$>` - Map

コンテナ内の値に関数を適用します。

```typescript
import { Box } from "f-box-core";

const box = Box.pack(5);
const result = box["<$>"]((x) => x * 2);
console.log(result.getValue()); // 出力: 10
```

#### `<*>` - Apply

コンテナでラップされた関数を別のコンテナでラップされた値に適用できます。

```typescript
import { Box } from "f-box-core";

const boxFn = Box.pack((x: number) => x + 3);
const boxValue = Box.pack(7);

const result = boxFn["<*>"](boxValue);
console.log(result.getValue()); // 出力: 10
```

#### `>>=` - FlatMap

コンテキストを処理しながら計算をチェーンします。

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("ゼロ除算") : Either.right(a / b);

const result = Either.right(10)
  [">>="](((x) => divide(x, 2)))
  [">>="](((x) => divide(x, 5)));

console.log(result["<|>"](0)); // 出力: 1
```

## クイックスタートガイド

### 各タイプの使用場面

| シナリオ | 推奨タイプ | 理由 |
|----------|------------------|------|
| シンプルなデータ変換 | `Box` | 純粋な関数合成 |
| React/Vue状態管理 | `RBox` | 組み込みリアクティビティとオブザーバー |
| nullの可能性があるAPIレスポンス | `Maybe` | null/undefined エラーの排除 |
| 失敗する可能性のある操作 | `Either` | 明示的なエラーハンドリング |
| 非同期操作 | `Task` | 合成可能なPromiseライクな動作 |

## 詳細な使用方法

### Box - 関数合成

値をカプセル化し、`map`、`flatMap`などによる関数型変換を可能にするコンテナです。

#### 基本例

```typescript
import { Box } from "f-box-core";

// 演算子チェーンによる値の変換
const result = Box.pack(10)
  ["<$>"]((x) => x * 2)    // 10 → 20
  ["<$>"]((x) => x + 5);   // 20 → 25

console.log(result.getValue()); // 出力: 25

// 複数のBoxを組み合わせる
const add = (x: number) => (y: number) => x + y;
const multiply = (x: number) => (y: number) => x * y;

const calculation = Box.pack(add)
  ["<*>"](Box.pack(10))   // add(10) を適用
  ["<*>"](Box.pack(5));   // add(10)(5) → 15

console.log(calculation.getValue()); // 出力: 15
```

#### 実例: データ処理パイプライン

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

const normalizeUser = (user: User): User => ({
  ...user,
  name: user.name.charAt(0).toUpperCase() + user.name.slice(1),
  email: user.email.toLowerCase()
});

const validateAge = (user: User): User | null =>
  user.age >= 18 ? user : null;

// 演算子チェーンによる処理パイプライン
const processUser = Box.pack({ name: "alice", age: 25, email: "ALICE@EXAMPLE.COM" })
  ["<$>"](normalizeUser)     // 名前とメールを正規化
  ["<$>"](validateAge)       // 年齢をバリデーション
  [">>="]((user) => user ? Box.pack(user) : Box.pack(null));

console.log(processUser.getValue()); // { name: "Alice", age: 25, email: "alice@example.com" }
```

### RBox - リアクティブ状態管理

ReactやVueなどのリアクティビティが必要なアプリケーションに最適な、状態を管理するためのリアクティブコンテナです。

#### 基本例

```typescript
import { RBox } from "f-box-core";

const counter = RBox.pack(0);

// 変更をサブスクライブ
counter.subscribe((value) => console.log(`カウンタ: ${value}`));

// 値を更新
counter.setValue(1); // 出力: "カウンタ: 1"
counter.setValue((prev) => prev + 5); // 出力: "カウンタ: 6"
```

#### 実例: リアクティブショッピングカート

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const cart = RBox.pack<CartItem[]>([]);

// 演算子チェーンによる派生値の作成
const cartTotal = cart["<$>"]((items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const cartCount = cart["<$>"]((items) => items.length);

const cartSummary = cart
  ["<$>"]((items) => items.length)
  [">>="](((count) => cartTotal["<$>"]((total) => ({ count, total }))));

// リアクティブな変更の監視
cart.subscribe((items) => console.log(`カートアイテム数: ${items.length}`));
cartTotal.subscribe((total) => console.log(`合計金額: ¥${total.toLocaleString()}`));

// 状態の更新
cart.setValue((prev) => [
  ...prev,
  { id: "1", name: "ラップトップ", price: 128000, quantity: 1 }
]);
```

### Maybe - Null安全性

`Just`または`Nothing`抽象化でオプショナル値を表現し、`null`や`undefined`エラーを防ぎます。

#### 基本例

```typescript
import { Maybe } from "f-box-core";

// 安全な値処理
const safeValue = Maybe.pack("hello");
const nullValue = Maybe.pack(null);

const result1 = safeValue["<$>"]((s) => s.toUpperCase())["<|>"]("DEFAULT");
const result2 = nullValue["<$>"]((s) => s.toUpperCase())["<|>"]("DEFAULT");

console.log(result1); // "HELLO"
console.log(result2); // "DEFAULT"
```

#### 実例: 安全なAPIデータ処理

```typescript
interface UserProfile {
  id: number;
  name?: string;
  avatar?: string;
  bio?: string;
}

// 演算子チェーンによる処理
const getUserDisplayName = (profile: UserProfile) =>
  Maybe.pack(profile.name)
    [">>="]((name: string) => Maybe.pack(profile.bio)
      [">>="]((bio: string) => {
        const cleanName = name.trim();
        const displayName = cleanName.length > 0 ? cleanName : "匿名";
        return Maybe.pack(`${displayName} - ${bio}`);
      }))
    ["<|>"]("ゲスト"); // 値を取得またはデフォルト値 (getOrElseのエイリアス)

// Do記法による同じ処理（シンプルなstring型のみ）
const getUserDisplayNameDo = (profile: UserProfile) =>
  Maybe.do<string, string>(function*() {
    const name = yield Maybe.pack(profile.name);
    const bio = yield Maybe.pack(profile.bio);
    const cleanName = name.trim();
    const displayName = cleanName.length > 0 ? cleanName : "匿名";
    return `${displayName} - ${bio}`;
  })["<|>"]("ゲスト"); // 値を取得またはデフォルト値

// 異なる型を扱う複雑なケースでは、演算子チェーンの方が明確なことが多いです

// Applicativeスタイルで複数の値を組み合わせ
const processUserProfile2 = (profile: UserProfile) => {
  const createProfile = (name: string) => (avatar: string) => (bio: string) => ({
    displayName: name.length > 0 ? name : "匿名",
    profileImage: avatar,
    description: bio.substring(0, 100)
  });

  return Maybe.pack(createProfile)
    ["<*>"](Maybe.pack(profile.name))
    ["<*>"](Maybe.pack(profile.avatar))
    ["<*>"](Maybe.pack(profile.bio));
};

const user = { id: 1, name: "Alice", avatar: "avatar.jpg", bio: "ソフトウェア開発者" };
const displayName = getUserDisplayName(user);
const displayNameDo = getUserDisplayNameDo(user);

console.log("表示名 (演算子):", displayName);
console.log("表示名 (Do記法):", displayNameDo);

// 注意: Do記法は同じ型の逐次操作に最適です。
// 異なる型を扱う複雑なネスト操作では、演算子チェーンの方が実用的なことが多いです。
```

### Either - エラーハンドリング

成功（`Right`）または失敗（`Left`）する計算をカプセル化します。

#### 基本例

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("ゼロ除算") : Either.right(a / b);

// 従来のチェーン
const result = divide(10, 2)
  ["<$>"]((x) => x * 3)
  ["<|>"](0);

console.log(result); // 15

// 演算子チェーンによる複雑な計算
const calculation = divide(10, 2)
  [">>="](((x) => divide(x, 5)))
  [">>="](((y) => divide(100, y)))
  ["<$>"]((z) => z * 2);

calculation.match(
  (error) => console.error("エラー:", error),
  (result) => console.log("結果:", result) // "結果: 200"
);
```

#### 実例: フォームバリデーション

```typescript
interface User {
  email: string;
  password: string;
  age: number;
}

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

// Applicativeスタイルでのバリデーション（複数の結果を同時に処理）
const validateUserApplicative = (data: any): Either<string[], User> => {
  const createUser = (email: string) => (password: string) => (age: number) => ({ email, password, age });

  return Either.pack(createUser)
    ["<*>"](validateEmail(data.email)["<$>"](email => [email]))
    ["<*>"](validatePassword(data.password)["<$>"](password => [password]))
    ["<*>"](validateAge(data.age)["<$>"](age => [age]));
};

// チェーン形式でのバリデーション（最初のエラーで停止）
const validateUser = (data: any): Either<string, User> =>
  validateEmail(data.email)
    [">>="](email => validatePassword(data.password)
      [">>="](password => validateAge(data.age)
        ["<$>"](age => ({ email, password, age }))));

// 使用例
const userData = { email: "user@example.com", password: "secretpassword", age: 25 };
const validationResult = validateUser(userData);

validationResult.match(
  (error) => console.error("バリデーション失敗:", error),
  (user) => console.log("有効なユーザー:", user)
);
```

### Task - 非同期操作

非同期計算を合成可能で関数型的な方法で管理します。

#### 基本例

```typescript
import { Task } from "f-box-core";

// シンプルな非同期操作
const fetchData = Task.from(() =>
  fetch("https://api.example.com/data").then(res => res.json())
);

// 操作をチェーン
const processedData = fetchData
  ["<$>"]((data) => data.map(item => item.name))
  ["<$>"]((names) => names.filter(name => name.length > 3));

processedData.run().then(console.log);
```

#### 実例: 非同期データの処理

```typescript
interface User { id: number; name: string; }

const fetchUser = (id: number): Task<User> =>
  Task.from(() => fetch(`/api/users/${id}`).then(res => res.json()));

const fetchUserProfile = (userId: number): Task<string> =>
  Task.from(() => fetch(`/api/users/${userId}/profile`).then(res => res.text()));

// 処理を小さな関数に分割
const getProfile = (user: User) => fetchUserProfile(user.id);
const formatProfile = (profile: string) => `Profile: ${profile}`;

// 関数を直接渡してシンプルに合成
const getUserInfo = (userId: number) =>
  fetchUser(userId)
    [">>="](getProfile)
    ["<$>"](formatProfile);

// 使用例
await getUserInfo(123)
  .run()
  .then(result => console.log(result)) // "Profile: ..."
  .catch(error => console.error("エラー:", error));
```

## 追加演算子

基本演算子に加えて、F-Boxの型はユーティリティ演算子も提供します：

| 演算子 | 用途 | 説明 |
|----------|---------|-------------|
| `<?>` | 代替値 | 現在の値が無効な場合に代替値を返す（`orElse`のエイリアス） |
| `<|>` | デフォルト値 | 値を取得するか、デフォルト値を返す（`getOrElse`のエイリアス） |

## 高度な機能

### エラー回復パターン

```typescript
// 指数バックオフによるリトライ
const retryTask = <T>(task: Task<T>, maxRetries: number = 3): Task<T> => {
  const attempt = (retriesLeft: number): Task<T> =>
    Task.tryCatch(
      () => task.run(),
      (error) => {
        if (retriesLeft <= 0) throw error;
        const delay = Math.pow(2, maxRetries - retriesLeft) * 1000;
        return new Promise(resolve =>
          setTimeout(() => resolve(attempt(retriesLeft - 1).run()), delay)
        );
      }
    );

  return attempt(maxRetries);
};
```

### 複数タイプの組み合わせ

```typescript
// リアクティブフォームバリデーション
const createReactiveForm = () => {
  const email = RBox.pack("");
  const password = RBox.pack("");

  // 演算子チェーンによるリアルタイムバリデーション
  const emailValidation = email["<$>"](validateEmail);
  const passwordValidation = password["<$>"](validatePassword);

  // 複数のバリデーション結果を組み合わせ
  const formValid = emailValidation
    [">>="]((emailResult) => passwordValidation
      ["<$>"]((passwordResult) =>
        emailResult.isRight && passwordResult.isRight));

  return { email, password, emailValidation, passwordValidation, formValid };
};

// EitherとTaskの組み合わせ
const authenticateUser = (credentials: LoginData) =>
  Task.from(() => Promise.resolve(validateCredentials(credentials)))
    [">>="]((validationResult) =>
      validationResult.isRight
        ? Task.from(() => loginAPI(validationResult.getValue()))
        : Task.pack(Either.left(validationResult.getValue())));
```

## パフォーマンスとバンドルサイズ

- **ゼロ依存**: 純粋なTypeScript実装
- **ツリーシェイク対応**: 必要な部分のみをインポート
- **軽量**: ライブラリ全体でgzip圧縮時約5KB
- **型安全**: 厳密な型付けによる完全なTypeScriptサポート

## 貢献

プルリクエストとイシュー報告を歓迎します。

### 開発環境セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/KentaroMorishita/f-box-core.git
cd f-box-core

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 開発コマンド

```bash
npm run dev      # Vite開発サーバーを起動
npm run build    # ライブラリをビルド
npm run lint     # TypeScriptで型チェック
npm test         # Vitestでテストをウォッチモードで実行
npm run coverage # カバレッジレポート付きでテスト実行
```

### テスト

- フレームワーク: Vitest
- 環境: jsdom
- 特定テスト実行: `npm test -- Box.test.ts`

## サポート

- [GitHub Issues](https://github.com/KentaroMorishita/f-box-core/issues) - バグ報告や機能要望
- [F-Box React](https://github.com/KentaroMorishita/f-box-react) - Reactフックとユーティリティ

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。