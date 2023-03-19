enum OperationType {
    CREATE,
    UPDATE,
    DELETE,
    NOOP
}

enum DayOfWeek {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}

enum EmailIdentificationCertainty {
    FAILED = 0,
    UNSURE = 1,
    CERTAIN = 2
}

enum ReceiptCategory {
    GROCERIES = 0,
    FAST_FOOD = 1,
    COFFEE = 2,
    HOSTING = 3,
    PROJECTS = 4,
    SHOPPING = 5,
    TRANSPORTATION = 6,
    DONATIONS = 7,
    AUTO_REPAIR = 8,
    TRAVEL = 9,
    RESTAURANT = 10,
    PARKING = 11,
    PET = 12,
    AUTO_INSURANCE = 13,
    GAMING = 14,
    NEWS = 15,
    AUTO_MAINTENANCE = 16,
    HEALTH = 17,
    ENTERTAINMENT = 18,
    EDUCATION = 19,
    UNCATEGORIZED = 1000
}

export {
    OperationType,
    DayOfWeek,
    EmailIdentificationCertainty,
    ReceiptCategory
}
