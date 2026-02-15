package com.example.todo.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class SessionTestController {

    @GetMapping("/api/session/test")
    public Map<String, Object> testSession(HttpSession session) {
        // Получаем значение из сессии
        Integer visitCount = (Integer) session.getAttribute("visitCount");

        if (visitCount == null) {
            visitCount = 1;
        } else {
            visitCount++;
        }

        // Сохраняем в сессию
        session.setAttribute("visitCount", visitCount);
        session.setAttribute("lastVisit", LocalDateTime.now().toString());
        session.setAttribute("userAgent", "Test User");

        // Информация о сессии
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("visitCount", visitCount);
        response.put("created", session.getCreationTime());
        response.put("lastAccess", session.getLastAccessedTime());
        response.put("maxInactive", session.getMaxInactiveInterval());
        response.put("allAttributes", session.getAttributeNames());

        return response;
    }

    @GetMapping("/api/session/clear")
    public String clearSession(HttpSession session) {
        session.invalidate();
        return "Session cleared!";
    }
}