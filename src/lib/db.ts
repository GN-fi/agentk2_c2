import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema"; // 생성한 스키마 파일 경로

// 환경 변수 로드 (.env.local 파일이 없어도 오류가 발생하지 않도록 수정)
try {
	dotenv.config({ path: ".env.local" });
} catch (error) {
	console.warn("Failed to load .env.local file:", error);
}

// CI 환경에서는 환경 변수가 없어도 빌드가 가능하도록 체크를 수정합니다.
// 실제 환경에서는 NEON_HTTP_URL이 필요하지만, CI 빌드에서는 더미 URL을 사용합니다.
// 주의: Neon HTTP URL은 반드시 postgresql:// 형식이어야 합니다.
const neonUrl =
	process.env.NEON_HTTP_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

// URL이 postgresql://로 시작하는지 확인 (CI 환경에서는 검증을 건너뜁니다)
if (process.env.NODE_ENV !== "production" && process.env.CI !== "true") {
	if (!neonUrl.startsWith("postgresql://")) {
		throw new Error(
			"Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value",
		);
	}
}

const sql = neon(neonUrl);
export const db = drizzle(sql, { schema });

// 기존 pg.Pool 및 ioredis 설정은 필요에 따라 유지하거나 제거합니다.
// 여기서는 Drizzle + Neon 설정만 남깁니다.

// import { Pool } from "pg";
// import Redis from "ioredis"; // Upstash Redis는 src/lib/cache.ts 에 있음

// export const pgPool = new Pool({
// 	connectionString: process.env.DATABASE_URL,
// });

// export const upstashRedis = new Redis(process.env.REDIS_URL as string); // 변수명 변경 또는 cache.ts의 redis 사용

// 간단한 연결 테스트 (선택 사항, 애플리케이션 로드 시 자동으로 실행되지 않도록 주의)
async function testConnections() {
	try {
		// Drizzle을 사용한 간단한 쿼리로 연결 테스트
		const result = await db
			.select({ count: schema.users.id })
			.from(schema.users)
			.limit(1);
		console.log(
			"Drizzle (Neon)에 성공적으로 연결되었으며, 사용자 수 조회 시도 결과:",
			result,
		);
	} catch (error) {
		console.error("Drizzle (Neon) 연결 실패:", error);
	}

	// Redis 연결 테스트는 src/lib/cache.ts 의 redis 인스턴스를 사용하거나, 여기서 직접 ioredis를 사용한다면 해당 설정 필요
	// try {
	//   // await upstashRedis.ping(); // 만약 이 파일에서 Redis를 직접 쓴다면
	//   // console.log("Redis에 성공적으로 연결되었습니다.");
	// } catch (error) {
	//   console.error("Redis 연결 실패:", error);
	// }
}

// 개발 환경에서만 또는 특정 조건에서만 테스트 함수를 호출하도록 할 수 있습니다.
// if (process.env.NODE_ENV === 'development') { testConnections(); }
