add_library(day03_account
	${CMAKE_CURRENT_SOURCE_DIR}/Day-03-Classes-Encapsulation/bank_account.cpp
)

target_compile_features(day03_account PUBLIC cxx_std_20)
target_include_directories(day03_account PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/Day-03-Classes-Encapsulation)

file(GLOB DAY_DIRECTORIES RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} "Day-*")

foreach(DAY_DIR ${DAY_DIRECTORIES})
	if(IS_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/${DAY_DIR}" AND EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/${DAY_DIR}/main.cpp")
		string(REGEX REPLACE "^Day-([0-9][0-9]).*$" "\\1" DAY_NUMBER "${DAY_DIR}")
		set(TARGET_NAME "day_${DAY_NUMBER}")
		add_executable(${TARGET_NAME} "${CMAKE_CURRENT_SOURCE_DIR}/${DAY_DIR}/main.cpp")
		target_compile_features(${TARGET_NAME} PRIVATE cxx_std_20)
		if(DAY_NUMBER STREQUAL "03")
			target_link_libraries(${TARGET_NAME} PRIVATE day03_account)
		endif()
	endif()
endforeach()
