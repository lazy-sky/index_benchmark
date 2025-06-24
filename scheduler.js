// 하루에 한 번 실행되는 스케줄러
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 실행 시간 설정 (매일 오전 9시)
const RUN_HOUR = 9;
const RUN_MINUTE = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runBenchmark = async () => {
  try {
    console.log('🚀 벤치마크 분석 시작...');
    const { stdout, stderr } = await execAsync('node index.js');
    
    if (stdout) {
      console.log('📊 분석 결과:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.error('⚠️ 경고:', stderr);
    }
    
    console.log('✅ 벤치마크 분석 완료');
  } catch (error) {
    console.error('❌ 벤치마크 실행 실패:', error.message);
  }
};

const shouldRun = () => {
  const now = new Date();
  return now.getHours() === RUN_HOUR && now.getMinutes() === RUN_MINUTE;
};

const main = async () => {
  console.log(`⏰ 스케줄러 시작 - 매일 ${RUN_HOUR}:${RUN_MINUTE.toString().padStart(2, '0')}에 실행`);
  
  while (true) {
    if (shouldRun()) {
      await runBenchmark();
      // 다음 실행까지 1분 대기 (중복 실행 방지)
      await sleep(60 * 1000);
    }
    
    // 1분마다 체크
    await sleep(60 * 1000);
  }
};

// Ctrl+C로 종료 처리
process.on('SIGINT', () => {
  console.log('\n👋 스케줄러 종료');
  process.exit(0);
});

main().catch(console.error); 