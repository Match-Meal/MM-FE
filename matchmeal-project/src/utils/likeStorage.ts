const STORAGE_KEYS = {
    POST: 'liked_posts',
    COMMENT: 'liked_comments',
} as const

type LikeType = keyof typeof STORAGE_KEYS

const getStorageKey = (type: LikeType) => STORAGE_KEYS[type]

const getLikedIds = (type: LikeType): number[] => {
    const key = getStorageKey(type)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
}

const saveLikedIds = (type: LikeType, ids: number[]) => {
    const key = getStorageKey(type)
    localStorage.setItem(key, JSON.stringify(ids))
}

export const saveLikeStatus = (type: LikeType, id: number, isLiked: boolean) => {
    const ids = getLikedIds(type)
    const index = ids.indexOf(id)

    if (isLiked && index === -1) {
        ids.push(id)
    } else if (!isLiked && index !== -1) {
        ids.splice(index, 1)
    }

    saveLikedIds(type, ids)
}

export const getLikeStatus = (type: LikeType, id: number): boolean => {
    const ids = getLikedIds(type)
    return ids.includes(id)
}
