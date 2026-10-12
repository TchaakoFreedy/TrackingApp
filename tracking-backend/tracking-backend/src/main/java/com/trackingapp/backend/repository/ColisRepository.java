package com.trackingapp.backend.repository;

import com.trackingapp.backend.model.Colis;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ColisRepository extends MongoRepository<Colis, String> {

    Optional<Colis> findByCodeSuivi(String codeSuivi);

    boolean existsByCodeSuivi(String codeSuivi);
}