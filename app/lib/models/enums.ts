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

export {
    OperationType,
    DayOfWeek,
    EmailIdentificationCertainty
}
