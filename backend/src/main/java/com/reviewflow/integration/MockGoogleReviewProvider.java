package com.reviewflow.integration;
import com.reviewflow.domain.Business; import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean; import org.springframework.stereotype.Service;
@Service @ConditionalOnMissingBean(GoogleReviewProvider.class) public class MockGoogleReviewProvider implements GoogleReviewProvider { public ReviewMetrics getBusinessMetrics(Business business){throw new IllegalStateException("Google Places API is not configured.");} }
