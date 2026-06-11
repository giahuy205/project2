package DuongGiaHuy._5.project2.config;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresRole {
    String value() default "admin";
}
