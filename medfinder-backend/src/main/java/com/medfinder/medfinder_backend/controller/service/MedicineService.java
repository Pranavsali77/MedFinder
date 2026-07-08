package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.*;
import com.medfinder.medfinder_backend.repository.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepo;
    private final InventoryRepository inventoryRepo;

    @Value("${ai.openrouter.api.key:}")
    private String openRouterApiKey;

    @Value("${ai.openrouter.model:google/gemini-2.5-flash}")
    private String openRouterModel;

    public MedicineService(MedicineRepository medicineRepo,
                           InventoryRepository inventoryRepo) {
        this.medicineRepo = medicineRepo;
        this.inventoryRepo = inventoryRepo;
    }

    // 🔹 Add new medicine (Admin)
    public Medicine addMedicine(Medicine medicine) {
        return medicineRepo.save(medicine);
    }

    // 🔹 Get all medicines
    public List<Medicine> getAllMedicines() {
        return medicineRepo.findAll();
    }

    // 🔹 Update medicine (Admin)
    public Medicine updateMedicine(Long id, Medicine medicineDetails) {
        Medicine medicine = medicineRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        medicine.setName(medicineDetails.getName());
        medicine.setManufacturer(medicineDetails.getManufacturer());
        medicine.setCategory(medicineDetails.getCategory());
        medicine.setPrescriptionRequired(medicineDetails.isPrescriptionRequired());
        medicine.setDescription(medicineDetails.getDescription());
        medicine.setGenericName(medicineDetails.getGenericName());
        return medicineRepo.save(medicine);
    }

    // 🔹 Delete medicine (Admin)
    public void deleteMedicine(Long id) {
        medicineRepo.deleteById(id);
    }

    // 🔹 Search medicine by name (User)
    public List<Medicine> searchMedicine(String name) {
        return medicineRepo.findByNameContainingIgnoreCase(name);
    }

    // 🔹 Add inventory (Pharmacy stock)
    public Inventory addInventory(Inventory inventory) {
        return inventoryRepo.save(inventory);
    }

    // 🔹 Get inventory by medicine ID
    public List<Inventory> getInventoryByMedicine(Long medicineId) {
        return inventoryRepo.findByMedicineId(medicineId);
    }

    // =========================================================
    // ⭐ FEATURE: Medicine Availability by Location
    // =========================================================

    public List<Inventory> findMedicineNearby(
            String name,
            double lat,
            double lng,
            double radiusKm) {

        List<Inventory> all =
                inventoryRepo.findByMedicine_NameContainingIgnoreCase(name);

        List<Inventory> result = new ArrayList<>();

        for (Inventory inv : all) {

            Pharmacy p = inv.getPharmacy();

            double distance = calculateDistance(
                    lat, lng,
                    p.getLatitude(),
                    p.getLongitude()
            );

            if (distance <= radiusKm && p.isApproved()) {
                result.add(inv);
            }
        }

        return result;
    }

    // =========================================================
    // ⭐ NEW FEATURE: AI Alternative Medicine Finder
    // =========================================================

    public List<Medicine> findAlternatives(String name) {

        List<Medicine> matches =
                medicineRepo.findByNameContainingIgnoreCase(name);

        if (matches.isEmpty()) {
            return List.of();
        }

        // Get generic name of first matched medicine
        String generic = matches.get(0).getGenericName();

        // Return all medicines with same generic
        return medicineRepo.findByGenericNameIgnoreCase(generic);
    }

    // =========================================================
    // ⭐ NEW FEATURE: AI Alternative Medicine Finder (with Stock)
    // =========================================================

    public List<Inventory> findAlternativesWithStock(String name) {
        List<Medicine> matches = medicineRepo.findByNameContainingIgnoreCase(name);
        if (matches.isEmpty()) {
            matches = medicineRepo.findByGenericNameContainingIgnoreCase(name);
        }

        List<Inventory> alternatives = new ArrayList<>();
        List<String> generics = new ArrayList<>();
        List<String> categories = new ArrayList<>();

        for (Medicine med : matches) {
            if (med.getGenericName() != null && !med.getGenericName().trim().isEmpty()) {
                generics.add(med.getGenericName().toLowerCase());
            }
            if (med.getCategory() != null && !med.getCategory().trim().isEmpty()) {
                categories.add(med.getCategory().toLowerCase());
            }
        }

        if (!generics.isEmpty()) {
            List<Inventory> allInventories = inventoryRepo.findAll();
            for (Inventory inv : allInventories) {
                if (inv.getStock() > 0 && inv.getMedicine() != null && inv.getPharmacy() != null && inv.getPharmacy().isApproved()) {
                    String gen = inv.getMedicine().getGenericName();
                    if (gen != null && generics.contains(gen.toLowerCase())) {
                        alternatives.add(inv);
                    }
                }
            }
        }

        if (alternatives.isEmpty() && !categories.isEmpty()) {
            List<Inventory> allInventories = inventoryRepo.findAll();
            for (Inventory inv : allInventories) {
                if (inv.getStock() > 0 && inv.getMedicine() != null && inv.getPharmacy() != null && inv.getPharmacy().isApproved()) {
                    String cat = inv.getMedicine().getCategory();
                    if (cat != null && categories.contains(cat.toLowerCase())) {
                        alternatives.add(inv);
                    }
                }
            }
        }

        if (alternatives.isEmpty() && "general".equalsIgnoreCase(name)) {
            List<Inventory> allInventories = inventoryRepo.findAll();
            for (Inventory inv : allInventories) {
                if (inv.getStock() > 0 && inv.getMedicine() != null && inv.getPharmacy() != null && inv.getPharmacy().isApproved()) {
                    alternatives.add(inv);
                    if (alternatives.size() >= 6) {
                        break;
                    }
                }
            }
        }

        return alternatives;
    }

    // =========================================================
    // ⭐ NEW FEATURE: Disease-Based Medicine & Store Finder
    // =========================================================

    public List<Inventory> findInventoriesByDisease(String query) {
        List<Inventory> results = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) {
            return results;
        }

        String lowerQuery = query.toLowerCase().trim();
        List<String> targetGenerics = new ArrayList<>();

        if (lowerQuery.contains("fever") || lowerQuery.contains("pain") || lowerQuery.contains("headache") || lowerQuery.contains("body pain")) {
            targetGenerics.add("diclofenac");
            targetGenerics.add("paracetamol");
            targetGenerics.add("ibuprofen");
        }
        if (lowerQuery.contains("allergy") || lowerQuery.contains("allergies") || lowerQuery.contains("cold") || lowerQuery.contains("cough") || lowerQuery.contains("sneezing") || lowerQuery.contains("runny nose")) {
            targetGenerics.add("hydroxyzine");
            targetGenerics.add("fexofenadine");
            targetGenerics.add("montelukast");
            targetGenerics.add("chlorpheniramine maleate");
        }
        if (lowerQuery.contains("fungal") || lowerQuery.contains("infection") || lowerQuery.contains("itch") || lowerQuery.contains("itching") || lowerQuery.contains("ringworm")) {
            targetGenerics.add("fluconazole");
            targetGenerics.add("ketoconazole");
            targetGenerics.add("clotrimazole");
        }
        if (lowerQuery.contains("depression") || lowerQuery.contains("anxiety") || lowerQuery.contains("stress")) {
            targetGenerics.add("duloxetine");
            targetGenerics.add("clonazepam");
            targetGenerics.add("escitalopram oxalate");
        }
        if (lowerQuery.contains("hypertension") || lowerQuery.contains("bp") || lowerQuery.contains("blood pressure") || lowerQuery.contains("heart")) {
            targetGenerics.add("ramipril");
            targetGenerics.add("ticagrelor");
            targetGenerics.add("amlodipine");
            targetGenerics.add("telmisartan");
        }
        if (lowerQuery.contains("asthma")) {
            targetGenerics.add("montelukast");
        }

        List<Inventory> allInventories = inventoryRepo.findAll();
        for (Inventory inv : allInventories) {
            if (inv.getStock() > 0 && inv.getMedicine() != null && inv.getPharmacy() != null && inv.getPharmacy().isApproved()) {
                Medicine med = inv.getMedicine();
                boolean matchFound = false;

                if (med.getGenericName() != null) {
                    String genNameLower = med.getGenericName().toLowerCase();
                    for (String target : targetGenerics) {
                        if (genNameLower.contains(target)) {
                            matchFound = true;
                            break;
                        }
                    }
                }

                if (!matchFound) {
                    String cat = med.getCategory();
                    String desc = med.getDescription();
                    String name = med.getName();
                    if ((cat != null && cat.toLowerCase().contains(lowerQuery)) ||
                        (desc != null && desc.toLowerCase().contains(lowerQuery)) ||
                        (name != null && name.toLowerCase().contains(lowerQuery))) {
                        matchFound = true;
                    }
                }

                if (matchFound) {
                    results.add(inv);
                }
            }
        }

        return results;
    }

    // =========================================================
    // ⭐ NEW FEATURE: AI-Powered Medicine Name Suggestion
    // =========================================================

    public String getAiSuggestion(String query, String lang) {
        if (openRouterApiKey == null || openRouterApiKey.isEmpty() || openRouterApiKey.equals("YOUR_OPENROUTER_KEY_HERE") || openRouterApiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            System.out.println("Warning: OpenRouter API Key is missing. Falling back to generic mock logic.");
            return extractGenericMock(query);
        }

        String languageName = "English";
        if ("hi".equalsIgnoreCase(lang)) languageName = "Hindi";
        else if ("mr".equalsIgnoreCase(lang)) languageName = "Marathi";
        else if ("es".equalsIgnoreCase(lang)) languageName = "Spanish";
        else if ("fr".equalsIgnoreCase(lang)) languageName = "French";

        try {
            String url = "https://openrouter.ai/api/v1/chat/completions";
            
            String prompt = "The user searched for a medicine named or related to '" + query + "'. " +
                    "Return 2 to 3 DIFFERENT generic medicines that are therapeutic alternatives (treats the same condition). " +
                    "For example, if they search for 'paracetamol', return 'ibuprofen' and 'aspirin'. " +
                    "Respond EXACTLY with a JSON array of objects. Each object must contain two keys: 'name' (the generic medicine name in lowercase) and 'description' (a 3 to 4 line easy-to-understand explanation of what it does and how it helps, written in simple everyday human language, translated into " + languageName + "). Do not include any markdown formatting.";

            // Using OpenAI format for OpenRouter
            String requestBody = "{" +
                    "\"model\": \"" + openRouterModel + "\"," +
                    "\"max_tokens\": 600," +
                    "\"messages\": [{\"role\": \"user\", \"content\": \"" + prompt + "\"}]" +
                    "}";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openRouterApiKey)
                    .header("HTTP-Referer", "http://localhost:5173")
                    .header("X-Title", "MedFinder")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(response.body());
                JsonNode choices = rootNode.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode message = choices.get(0).path("message");
                    if (message != null && !message.isMissingNode()) {
                        String aiText = message.path("content").asText();
                        return aiText.replace("```json", "").replace("```", "").trim();
                    }
                }
            } else {
                System.out.println("AI Request failed: " + response.statusCode() + " " + response.body());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return extractGenericMock(query);
    }

    // Fallback if API key is not configured or fails
    private String extractGenericMock(String query) {
        String lowerQuery = query.toLowerCase().trim();
        String alt1 = query;
        String alt2 = query + " alternative";
        
        if (lowerQuery.contains("loperamide") || lowerQuery.contains("imodium")) {
            alt1 = "metronidazole";
            alt2 = "bismuth subsalicylate";
        } else if (lowerQuery.contains("omeprazole")) {
            alt1 = "pantoprazole";
            alt2 = "ranitidine";
        } else if (lowerQuery.contains("xyz")) {
            alt1 = "paracetamol";
            alt2 = "ibuprofen";
        }
        
        return "[{\"name\": \"" + alt1 + "\", \"description\": \"Generic alternative for " + alt1 + "\"}, {\"name\": \"" + alt2 + "\", \"description\": \"Generic alternative for " + alt2 + "\"}]";
    }

    // 🔹 Distance calculation (Haversine formula)
    private double calculateDistance(double lat1, double lon1,
                                     double lat2, double lon2) {

        final int R = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2)
                * Math.sin(dLon/2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // =========================================================
    // ⭐ NEW FEATURE: AI Prescription Scanner
    // =========================================================

    public List<String> scanPrescription(MultipartFile file) {
        try {
            return scanPrescription(file.getBytes());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<String> scanPrescription(byte[] fileContent) {
        if (openRouterApiKey == null || openRouterApiKey.isEmpty() || openRouterApiKey.equals("YOUR_OPENROUTER_KEY_HERE")) {
            System.out.println("Warning: OpenRouter API Key is missing.");
            return new ArrayList<>();
        }

        try {
            String encodedString = Base64.getEncoder().encodeToString(fileContent);

            String url = "https://openrouter.ai/api/v1/chat/completions";
            
            String prompt = "Extract all medicine names from this prescription. Respond EXACTLY with a JSON array of strings containing ONLY the generic or brand medicine names in lowercase (e.g. [\"paracetamol\", \"amoxicillin\"]). Do not include any markdown formatting, explanations, or backticks.";

            String requestBody = "{" +
                    "\"model\": \"" + openRouterModel + "\"," +
                    "\"max_tokens\": 500," +
                    "\"messages\": [" +
                        "{\"role\": \"user\", \"content\": [" +
                            "{\"type\": \"text\", \"text\": \"" + prompt + "\"}," +
                            "{\"type\": \"image_url\", \"image_url\": {\"url\": \"data:image/jpeg;base64," + encodedString + "\"}}" +
                        "]}" +
                    "]" +
                    "}";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openRouterApiKey)
                    .header("HTTP-Referer", "http://localhost:5173")
                    .header("X-Title", "MedFinder")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(response.body());
                JsonNode choices = rootNode.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode message = choices.get(0).path("message");
                    if (message != null && !message.isMissingNode()) {
                        String aiText = message.path("content").asText();
                        aiText = aiText.replace("```json", "").replace("```", "").trim();
                        // Strip anything outside brackets to ensure clean JSON
                        int startIndex = aiText.indexOf('[');
                        int endIndex = aiText.lastIndexOf(']');
                        if (startIndex >= 0 && endIndex >= startIndex) {
                            aiText = aiText.substring(startIndex, endIndex + 1);
                            return mapper.readValue(aiText, mapper.getTypeFactory().constructCollectionType(List.class, String.class));
                        }
                    }
                }
            } else {
                System.out.println("OpenRouter Vision API Error: " + response.statusCode() + " " + response.body());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }
}