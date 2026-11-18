package com.example.Save.File.Drive.Utils;

import java.util.UUID;

public final class UUIDGenerator {

    private UUIDGenerator() {
    }

    public static String generateULID() {
        return UUID.randomUUID().toString();
    }
}
