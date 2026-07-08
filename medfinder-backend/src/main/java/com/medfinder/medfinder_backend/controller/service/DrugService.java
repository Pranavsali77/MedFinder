package com.medfinder.medfinder_backend.controller.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DrugService {

    @Value("${openfda.api.key}")
    private String apiKey;

    private final String BASE_URL = "https://api.fda.gov/drug/label.json";

    public String searchDrugByGenericName(String drugName) {

        String url = BASE_URL
                + "?search=openfda.generic_name:" + drugName
                + "&limit=1"
                + "&api_key=" + apiKey;

        RestTemplate restTemplate = new RestTemplate();

        return restTemplate.getForObject(url, String.class);
    }

    public String searchDrugByBrandName(String brandName) {

        String url = BASE_URL
                + "?search=openfda.brand_name:" + brandName
                + "&limit=1"
                + "&api_key=" + apiKey;

        RestTemplate restTemplate = new RestTemplate();

        return restTemplate.getForObject(url, String.class);
    }
}