package com.example.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import com.example.backend.booking.entity.BookingStatus;

@Configuration
public class MongoEnumConvertersConfig {

	@Bean
	public MongoCustomConversions mongoCustomConversions() {
		return new MongoCustomConversions(List.of(new BookingStatusReadConverter()));
	}

	@ReadingConverter
	static class BookingStatusReadConverter implements Converter<String, BookingStatus> {
		@Override
		public BookingStatus convert(String source) {
			return BookingStatus.fromExternalValue(source);
		}
	}
}
