import { IUser, IPreferences, IGetUser } from '@/app/_contexts/UserTypes';
import { CardImageLocale } from '@/app/_utils/s3Utils';

/**
 * Gets user information for a payload, using anonymous user if none provided
 * @param {Object} user - Optional user object
 * @return {Object} The user object to use in payloads
 */
export const getUserPayload = (user: IUser | null): object => {
    if (user) {
        return user;
    }

    const anonymousId = localStorage.getItem('anonymousUserId');
    return {
        id: anonymousId,
        username: 'anonymous ' + anonymousId?.substring(0, 6),
    };
}


/* Server */
export const getUserFromServer = async(): Promise<IGetUser> =>{
    try {
        // Upstream also uploaded locally saved decks here; this site keeps no deck storage.
        const payload = {
            decks: [],
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-user`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            const errors = result.errors || {};
            console.log(errors);
            throw new Error(errors);
        }
        savePreferencesToLocalStorage(result.user.preferences);
        return result.user;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/**
 * Saves sound preferences to the server
 * @param user The current user
 * @param preferences
 * @returns Promise that resolves to boolean indicating success
 */
// Helper function to remove undefined values from nested objects
const removeUndefinedValues = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues) as T;
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
            cleaned[key] = removeUndefinedValues(value);
        }
    }
    return cleaned as T;
};

export const savePreferencesToServer = async (
    user: IUser,
    preferences: IPreferences
): Promise<boolean> => {
    try {
        // Remove undefined values to prevent DynamoDB issues
        const cleanedPreferences = removeUndefinedValues(preferences);

        const payload = {
            preferences: cleanedPreferences
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/user/${user.id}/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to save preferences');
        }

        return result.success;
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
    }
};

/**
 * Saves preferences to localStorage for anonymous users
 * @param preferences The preferences to save
 */
export const savePreferencesToLocalStorage = (preferences: IPreferences): void => {
    try {
        localStorage.setItem('swu_preferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences to localStorage:', error);
    }
};

/**
 * Loads preferences from localStorage for anonymous users
 * @returns The preferences object or default preferences
 */
export const loadPreferencesFromLocalStorage = (): IPreferences => {
    try {
        const preferencesJSON = localStorage.getItem('swu_preferences');
        if (preferencesJSON) {
            const preferences = JSON.parse(preferencesJSON) as IPreferences;
            // Ensure sound preferences have defaults if missing
            return {
                sound: {
                    muteAllSound: preferences.sound?.muteAllSound ?? false,
                    muteCardAndButtonClickSound: preferences.sound?.muteCardAndButtonClickSound ?? false,
                    muteYourTurn: preferences.sound?.muteYourTurn ?? false,
                    muteChatSound: preferences.sound?.muteChatSound ?? false,
                    muteOpponentFoundSound: preferences.sound?.muteOpponentFoundSound ?? false,
                },
                cosmetics: {
                    cardback: preferences.cosmetics?.cardback,
                    background: preferences.cosmetics?.background,
                    // playmat: preferences.cosmetics?.playmat,
                    // disablePlaymats: preferences.cosmetics?.disablePlaymats ?? false,
                },
                gameOptions: {
                    muteChat: preferences.gameOptions?.muteChat ?? false,
                    cardLanguage: preferences.gameOptions?.cardLanguage ?? CardImageLocale.English,
                    timerVisibility: preferences.gameOptions?.timerVisibility,
                    autoResolve: {
                        singleTarget: preferences.gameOptions?.autoResolve?.singleTarget ?? false,
                    },
                },
            };
        }
    } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
    }

    // Return default preferences if nothing found or error occurred
    return {
        sound: {
            muteAllSound: false,
            muteCardAndButtonClickSound: false,
            muteYourTurn: false,
            muteChatSound: false,
            muteOpponentFoundSound: false,
        },
        cosmetics: {
            cardback: undefined,
            background: undefined,
            // playmat: undefined,
            // disablePlaymats: false,
        },
        gameOptions: {
            muteChat: false,
            cardLanguage: CardImageLocale.English,
            timerVisibility: undefined,
        },
    };
};
