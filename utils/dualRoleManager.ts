import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type RoleVariant = "CONSUMER" | "RETAILER";

type RetailerStatus = "pending" | "skipped" | "completed";

export interface DualRoleProfile {
  userKey: string;
  consumerSnapshot: Snapshot;
  retailerSnapshot: Snapshot & { setupStatus: RetailerStatus };
  createdAt: number;
  updatedAt: number;
}

interface Snapshot {
  name: string;
  email: string;
  passwordHash?: string;
}

const KEY_PREFIX = "@sugbudeals:dual-role:";
const ACTIVE_ROLE_PREFIX = "@sugbudeals:role-active:";

const sanitizeKey = (value?: number | string | null) =>
  String(value ?? "").trim().toLowerCase();

const buildProfileKey = (userKey: string) => `${KEY_PREFIX}${userKey}`;
const buildActiveRoleKey = (userKey: string) => `${ACTIVE_ROLE_PREFIX}${userKey}`;

async function hashSecret(secret: string) {
  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      secret
    );
  } catch {
    return secret;
  }
}

async function readProfile(userKey: string) {
  const raw = await AsyncStorage.getItem(buildProfileKey(userKey));
  return raw ? (JSON.parse(raw) as DualRoleProfile) : null;
}

async function writeProfile(profile: DualRoleProfile) {
  await AsyncStorage.setItem(
    buildProfileKey(profile.userKey),
    JSON.stringify(profile)
  );
  return profile;
}

export const DualRoleManager = {
  async bootstrap(params: {
    userId?: number | string;
    email: string;
    name: string;
    password: string;
  }) {
    const userKey = sanitizeKey(params.userId ?? params.email);
    if (!userKey) {
      throw new Error("Unable to bootstrap dual role profile without user id");
    }
    const passwordHash = await hashSecret(params.password);
    const profile: DualRoleProfile = {
      userKey,
      consumerSnapshot: {
        name: params.name,
        email: params.email,
        passwordHash,
      },
      retailerSnapshot: {
        name: params.name,
        email: params.email,
        passwordHash,
        setupStatus: "pending",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await writeProfile(profile);
    await AsyncStorage.setItem(buildActiveRoleKey(userKey), "CONSUMER");
    return profile;
  },

  async get(userIdOrEmail?: number | string | null) {
    const userKey = sanitizeKey(userIdOrEmail);
    if (!userKey) return null;
    return readProfile(userKey);
  },

  async getActiveRole(userIdOrEmail?: number | string | null) {
    const userKey = sanitizeKey(userIdOrEmail);
    if (!userKey) return null;
    return (await AsyncStorage.getItem(buildActiveRoleKey(userKey))) as
      | RoleVariant
      | null;
  },

  async setActiveRole(userKey: string, role: RoleVariant) {
    await AsyncStorage.setItem(buildActiveRoleKey(userKey), role);
  },

  async syncConsumerSnapshot(
    userKey: string,
    snapshot: { name?: string; email?: string; password?: string }
  ) {
    const profile = await readProfile(userKey);
    if (!profile) return null;

    const nextSnapshot: Snapshot = {
      name: snapshot.name ?? profile.consumerSnapshot.name,
      email: snapshot.email ?? profile.consumerSnapshot.email,
      passwordHash: snapshot.password
        ? await hashSecret(snapshot.password)
        : profile.consumerSnapshot.passwordHash,
    };

    profile.consumerSnapshot = nextSnapshot;
    profile.retailerSnapshot = {
      ...profile.retailerSnapshot,
      name: nextSnapshot.name,
      email: nextSnapshot.email,
      passwordHash: nextSnapshot.passwordHash,
    };
    profile.updatedAt = Date.now();
    await writeProfile(profile);
    return profile;
  },

  async setRetailerStatus(userKey: string, status: RetailerStatus) {
    const profile = await readProfile(userKey);
    if (!profile) return null;
    profile.retailerSnapshot = {
      ...profile.retailerSnapshot,
      setupStatus: status,
    };
    profile.updatedAt = Date.now();
    await writeProfile(profile);
    return profile;
  },

  isInSync(
    profile: DualRoleProfile,
    consumer: { name?: string; email?: string }
  ) {
    const normalizedName = (consumer.name ?? "").trim();
    const normalizedEmail = (consumer.email ?? "").trim().toLowerCase();
    return (
      normalizedName === profile.consumerSnapshot.name.trim() &&
      normalizedEmail ===
        profile.consumerSnapshot.email.trim().toLowerCase()
    );
  },
};


