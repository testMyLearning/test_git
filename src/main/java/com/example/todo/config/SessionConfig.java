package com.example.todo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisHttpSession
public class SessionConfig {
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();

        // Настраиваем куки для сессий
        serializer.setCookieName("SESSIONID");  // Имя куки (вместо стандартного JSESSIONID)
        serializer.setCookiePath("/");          // Доступность куки для всех путей
        serializer.setDomainNamePattern("^.+?\\.(\\w+\\.[a-z]+)$"); // Паттерн домена
        serializer.setUseHttpOnlyCookie(true);  // Защита от XSS
        serializer.setUseSecureCookie(false);   // Для разработки false, для продакшена true

        return serializer;
    }
}
