package com.reviewflow.integration;
import com.reviewflow.domain.Business;
public interface GoogleReviewProvider { ReviewMetrics getBusinessMetrics(Business business); record ReviewMetrics(double rating,int reviewCount,String placeId){} }
